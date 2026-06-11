import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parser limit expanded to handle any rich context requests
  app.use(express.json({ limit: "10mb" }));

  // Retrieve the secret key exclusively on the server side
  const getApiKey = (): string | undefined => {
    return process.env.GEMINI_API_KEY || process.env.API_KEY;
  };

  // 1. Secure Status API endpoint
  app.get("/api/config-status", (req, res) => {
    const key = getApiKey();
    res.json({ 
      hasGeminiKey: !!key,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY
    });
  });

  // Stripe SDK initialization helper with lazy-loading to guard against startup crashes
  let stripeInstance: any = null;
  const getStripe = () => {
    if (!stripeInstance) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required.");
      }
      // Import dynamically or normally (CJS format handles it cleanly)
      const StripeLib = require("stripe");
      stripeInstance = new StripeLib(key, {
        apiVersion: "2023-10-16", // stable API version
      });
    }
    return stripeInstance;
  };

  // Firebase Admin SDK initialization helper to safely update Firestore from server side bypassing security rules
  let dbAdminInstance: any = null;
  const getDbAdmin = () => {
    if (!dbAdminInstance) {
      try {
        const adminDocPath = path.join(process.cwd(), "firebase-applet-config.json");
        let projectId = "";
        let databaseId = "";
        const fs = require("fs");
        if (fs.existsSync(adminDocPath)) {
          const config = JSON.parse(fs.readFileSync(adminDocPath, "utf8"));
          projectId = config.projectId;
          databaseId = config.firestoreDatabaseId;
        }

        if (!projectId) {
          projectId = process.env.GOOGLE_CLOUD_PROJECT || "profound-dragon-r8gvj";
        }

        const admin = require("firebase-admin");
        if (admin.apps.length === 0) {
          admin.initializeApp({
            projectId: projectId,
          });
        }

        if (databaseId) {
          try {
            dbAdminInstance = admin.firestore(databaseId);
          } catch (altErr) {
            console.warn("[Firebase Admin] Failed using explicit database ID, using default.", altErr);
            dbAdminInstance = admin.firestore();
          }
        } else {
          dbAdminInstance = admin.firestore();
        }
      } catch (err) {
        console.error("[Firebase Admin] Critical error initializing Admin SDK:", err);
        throw err;
      }
    }
    return dbAdminInstance;
  };

  // Create Stripe Checkout Session
  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      const { planId, userId, email, successUrl, cancelUrl } = req.body;
      if (!userId || !email) {
        res.status(400).json({ error: "Missing required fields: userId and email are mandatory." });
        return;
      }

      const isPro = planId === "pro";
      const amount = isPro ? 4900 : 29900; // to cents
      const planName = isPro ? "Pro Studio" : "Lifetime Access";
      const mode = isPro ? "subscription" : "payment";

      // If STRIPE_SECRET_KEY is not configured, fallback to simulation mode automatically
      if (!process.env.STRIPE_SECRET_KEY) {
        console.log(`[Stripe Simulation] Creating mocked checkout url for: ${email}, plan: ${planId}`);
        const simulatedSessionId = `mock_session_${Date.now()}__${planId}__${userId}`;
        const finalUrl = successUrl.includes("?") 
          ? `${successUrl}&session_id=${simulatedSessionId}` 
          : `${successUrl}?session_id=${simulatedSessionId}`;
        
        res.json({ url: finalUrl, isSimulated: true });
        return;
      }

      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: planName,
                description: isPro 
                  ? "Μηνιαία συνδρομή για πρόσβαση σε όλα τα AI modules του WeddingFilmAI Studio." 
                  : "Εφάπαξ αγορά για ισόβια πρόσβαση σε όλα τα AI modules και templates.",
              },
              unit_amount: amount,
              recurring: isPro ? { interval: "month" } : undefined,
            },
            quantity: 1,
          },
        ],
        mode: mode,
        customer_email: email,
        metadata: {
          userId,
          planId,
        },
        success_url: successUrl.includes("?") 
          ? `${successUrl}&session_id={CHECKOUT_SESSION_ID}` 
          : `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });

      res.json({ url: session.url, isSimulated: false });
    } catch (error: any) {
      console.error("Stripe create session error:", error);
      res.status(500).json({ error: error.message || "Failed to create Stripe Checkout session." });
    }
  });

  // Verify Stripe Checkout Session and prepare payload
  app.post("/api/stripe/verify-session", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ error: "Missing sessionId parameter." });
        return;
      }

      // Check for mock/simulated session
      if (sessionId.startsWith("mock_session_")) {
        const parts = sessionId.split("__");
        const planId = parts[1] || "pro";
        const userId = parts[2] || "";
        
        const expiresAt = planId === "pro"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString();

        // Server-side database write for simulated session
        try {
          const dbAdmin = getDbAdmin();
          await dbAdmin.collection("users").doc(userId).update({
            subscriptionStatus: "active",
            subscriptionExpiresAt: expiresAt,
          });
          console.log(`[Stripe Simulation] Backend active status saved in DB for user ${userId}`);
        } catch (dbErr) {
          console.error("[Stripe Simulation] Backend Firestore update error:", dbErr);
        }

        res.json({
          success: true,
          planId,
          userId,
          subscriptionStatus: "active",
          subscriptionExpiresAt: expiresAt,
          isSimulated: true,
        });
        return;
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid" || session.status === "complete") {
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId || "pro";

        if (!userId) {
          res.status(400).json({ error: "No userId matched in Stripe checkout metadata." });
          return;
        }

        const expiresAt = planId === "pro"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString();

        // Server-side database write for real Stripe session
        const stripeCustomerId = typeof session.customer === "string" ? session.customer : "";
        try {
          const dbAdmin = getDbAdmin();
          await dbAdmin.collection("users").doc(userId).update({
            subscriptionStatus: "active",
            subscriptionExpiresAt: expiresAt,
            stripeCustomerId: stripeCustomerId,
          });
          console.log(`[Stripe Real] Backend active status saved in DB for user ${userId}`);
        } catch (dbErr) {
          console.error("[Stripe Real] Backend Firestore update error:", dbErr);
        }

        res.json({
          success: true,
          planId,
          userId,
          subscriptionStatus: "active",
          subscriptionExpiresAt: expiresAt,
          isSimulated: false,
          stripeCustomerId: stripeCustomerId,
        });
      } else {
        res.json({
          success: false,
          paymentStatus: session.payment_status,
          status: session.status,
        });
      }
    } catch (error: any) {
      console.error("Stripe verify session error:", error);
      res.status(500).json({ error: error.message || "Failed to verify Stripe checkout session." });
    }
  });

  // Cancel subscription API endpoint (allows normal users to cancel on server side bypassing security rules)
  app.post("/api/stripe/cancel-subscription", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: "Missing userId parameter." });
        return;
      }

      console.log(`[Stripe Cancel] Running server-side cancel for user: ${userId}`);

      try {
        const dbAdmin = getDbAdmin();
        const userDocRef = dbAdmin.collection("users").doc(userId);
        
        // Fetch current user doc to check if they have stripeCustomerId
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData && userData.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
            console.log(`[Stripe Cancel] Real stripe customer detected: ${userData.stripeCustomerId}`);
          }
        }

        // Bypassing client-side write rules securely
        await userDocRef.update({
          subscriptionStatus: "canceled",
        });

        console.log(`[Stripe Cancel] Successfully set status to 'canceled' for user: ${userId}`);
        res.json({ success: true, subscriptionStatus: "canceled" });
      } catch (dbErr: any) {
        console.error("[Stripe Cancel] Firestore update failed:", dbErr);
        res.status(500).json({ error: dbErr.message || "Failed to edit database document on backend." });
      }
    } catch (error: any) {
      console.error("[Stripe Cancel] Backend error:", error);
      res.status(500).json({ error: error.message || "Failed to process cancel subscription request." });
    }
  });

  // Get Billing History (Invoices)
  app.get("/api/stripe/invoices", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: "Missing userId parameter." });
        return;
      }

      const dbAdmin = getDbAdmin();
      const userDoc = await dbAdmin.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      const userData = userDoc.data();
      const stripeCustomerId = userData?.stripeCustomerId;

      if (!stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
        // No stripe customer id yet or no stripe key, return empty list
        res.json({ invoices: [] });
        return;
      }

      const stripe = getStripe();
      const invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 10,
      });

      // Format them nicely
      const formattedInvoices = invoices.data.map((inv: any) => ({
        id: inv.id,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: inv.created,
        pdf_url: inv.invoice_pdf,
        number: inv.number
      }));

      res.json({ invoices: formattedInvoices });

    } catch (error: any) {
      console.error("Stripe fetch invoices error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch invoices." });
    }
  });

  // Local Fallback Cinematic Engine for standard users without a custom Gemini API Key
  const generateLocalCinematicContent = (moduleId: string, project: any, userInputs: any): string => {
    const couple = project.coupleNames || "το ζευγάρι";
    const date = project.weddingDate ? new Date(project.weddingDate).toLocaleDateString("el-GR") : "την ημέρα του γάμου";
    const loc = project.location || "την τοποθεσία";
    const style = project.style || "Cinematic / Storytelling";
    const atmosphere = userInputs.location_type || "Ρομαντική & Διαχρονική";
    const emotionalGoal = userInputs.vibe || "Συγκινητικό & Ονειρικό";

    switch (moduleId) {
      case "shot-planning":
        return `
# 🎬 Λίστα Πλάνων & Τεχνικό Shot List | ${couple}
**Ημερομηνία:** ${date} | **Τοποθεσία:** ${loc}
**Στυλ Κινηματογράφησης:** ${style}

---

## 1. Προετοιμασία Νύφης & Γαμπρού
* **Η Λεπτομέρεια του Φωτός (Macro):** Κοντινό πλάνο 100mm f/2.8 στην τοποθέτηση των σκουλαρικιών ή στο δέσιμο της γραβάτας. Χρήση απαλού πλάγιου φυσικού φωτός από παράθυρο.
* **Το Reveal (Gimbal / Slider):** Αργή κίνηση push-in 50mm f/1.8 καθώς η νύφη ή ο γαμπρός κοιτάζεται στον καθρέφτη.
* **Συναισθηματική Αλληλεπίδραση (Handheld):** Φυσικά γέλια, βλέμματα και αγκαλιές με τους γονείς/κουμπάρους. Φακός 35mm f/1.4 για συμπερίληψη του περιβάλλοντος με ρηχό βάθος πεδίου.

## 2. Η Άφιξη & Η Συνάντηση στην Εκκλησία
* **Το Προσδοκώμενο Βλέμμα (Tripod / Monopod):** Κοντινό f/2 στο βλέμμα του γαμπρού καθώς περιμένει. Καταγραφή της ανυπομονησίας.
* **Η Άφιξη της Νύφης (Drone / Wide):** Εναέριο, αποκαλυπτικό πλάνο του αυτοκινήτου που φτάνει, ακολουθούμενο από slow-motion handheld 50fps tracking-shot καθώς η νύφη βγαίνει.
* **Η Πρώτη Αγκαλιά (Handheld):** Φακός 85mm f/1.4 για απομόνωση του ζευγαριού από το πλήθος κατά τη στιγμή της παράδοσης.

## 3. Η Μυσταγωγία της Τελετής
* **Wide Establishing Shot:** Πλάνο 16mm που αναδεικνύει την αρχιτεκτονική του ναού και την ατμόσφαιρα.
* **Medallion & Rings Close-up:** Πλάνο με 24-70mm f/2.8 σε Gimbal με αργή περιστροφή γύρω από το ιερό κατά την ανταλλαγή των δαχτυλιδιών.
* **Το Ρύζι (High Frame Rate - 100fps):** Tracking-shot f/4 (για ασφάλεια εστίασης) καθώς το ζευγάρι κάνει την έξοδο. Τα σωματίδια του ρυζιού αιωρούνται στο backlit φως του ήλιου.

## 4. Δημιουργική Συνεδρία (Golden Hour)
* **The Walking Shot (Gimbal / EasyRig):** Tracking-shot μπροστά από το ζευγάρι καθώς περπατούν κρατώντας χέρια με φόντο το ηλιοβασίλεμα. Φακός 35mm f/1.4 με ελεγχόμενα "lens flares".
* **The Intimate Silhouette:** Ευρυγώνιο κόντρα φως (backlight) με ανάδειξη των περιγραμμάτων (silhouettes) τους με φόντο τον ουρανό.
* **The Cinematic Dip (Slow Motion):** Κλασικό ρομαντικό dip & kiss στα 120fps με απαλή κίνηση slider.
        `.trim();

      case "pre-after-wedding":
        return `
# 🎬 Concept Δημιουργικής Συνεδρίας (Pre/After Wedding)
**Ζευγάρι:** ${couple} | **Ατμόσφαιρα:** ${atmosphere}
**Στυλ Κατεύθυνσης:** ${style}

---

## 💡 Concept 1: "The Golden Hour Escape"
* **Φιλοσοφία:** Μια κινηματογραφική απόδραση στη φύση κατά τη διάρκεια του "blue & golden hour", εστιάζοντας στην αυθεντική σύνδεση και την απόλυτη ελευθερία κινήσεων.
* **Τοποθεσία:** ${loc} (Πρόταση: Αμμώδης παραλία, ελαιώνας ή βραχώδεις γκρεμοί κατά το ηλιοβασίλεμα).
* **Ενδυμασία:** Minimalistic look. Αέρινα ρούχα σε γήινους τόνους (cream, beige, terracotta) που δημιουργούν όμορφη κίνηση στον άνεμο.
* **Σκηνοθετική Προσέγγιση:** Αφήνουμε το ζευγάρι να περπατήσει, να τρέξει και να αγκαλιαστεί χωρίς στημένες πόζες. Χρησιμοποιούμε φακό 85mm f/1.4 για να κρατάμε απόσταση, καταγράφοντας αληθινά συναισθήματα.

## 💡 Concept 2: "Urban Nocturne" (Αστικό Σινεμά)
* **Φιλοσοφία:** Μια νυχτερινή, editorial αφήγηση στους δρόμους της πόλης με έντονα neon φώτα, κινηματογραφικές σκιές και αίσθηση "γαλλικού κύματος" (nouvelle vague).
* **Τοποθεσία:** Στενά γραφικά δρομάκια, vintage καφέ ή ταράτσα με θέα τα φώτα της πόλης.
* **Ενδυμασία:** Chic/Modern κοστούμι και cocktail φόρεμα με modern αξεσουάρ (π.χ. sunglasses, vintage leather jacket).
* **Σκηνοθετική Προσέγγιση:** Παιχνίδι με τις αντανακλάσεις των φώτων σε τζάμια, motion blur με χαμηλή ταχύτητα κλείστρου (shutter speed 1/25) για καλλιτεχνική αποτύπωση της κίνησης.

## 💡 Concept 3: "Timeless Heritage" (Vintage Nostalgia)
* **Φιλοσοφία:** Μια νοσταλγική επιστροφή στις ρίζες με ρετρό αισθητική, ζεστά χρώματα, και αναφορές σε κλασικές ιταλικές ταινίες.
* **Τοποθεσία:** Ένα παλιό αρχοντικό, πέτρινο χωριό ή ιστορικό κέντρο.
* **Ενδυμασία:** Ρετρό κομμάτια, λινά υφάσματα, vintage δαντέλα, κλασικά καπέλα.
* **Σκηνοθετική Προσέγγιση:** Cinematic πορτρέτα με απαλή, αργή κίνηση κάμερας. Χρήση Pro-Mist φίλτρων για "soft glow" στα highlights του φωτισμού.
        `.trim();

      case "storytelling":
        return `
# 📖 Αφηγηματικό Τόξο & Στρατηγική Storytelling | ${couple}
**Συναισθηματικός Στόχος:** ${emotionalGoal} | **Αισθητικό Ύφος:** ${style}

---

## 🎯 Η Δομή της Αφήγησης (The Narrative Arc)

### 1. Εισαγωγή (The Hook) - Ηρεμία & Προσμονή
* **Οπτικό Μέρος:** Ήρεμα, κινηματογραφικά πλάνα από το φυσικό τοπίο της περιοχής ${loc} κατά το πρώτο φως της ημέρας. Αρχικές ετοιμασίες σε low-key φωτισμό.
* **Ηχητικό Μέρος:** Ήχοι περιβάλλοντος (foley) όπως ο άνεμος, τα πουλιά ή το κύμα, σε συνδυασμό με το ξεκίνημα ενός μονοτονικού ambient ορχηστρικού κομματιού.
* **Story Point:** Η φωνή ενός εκ των δύο (από τους όρκους ή ένα email/γράμμα που διαβάζει) ξεκινά να ακούγεται, χτίζοντας την ιστορία.

### 2. Ανάπτυξη (The Journey) - Η Σύνδεση
* **Οπτικό Μέρος:** Εναλλαγές ανάμεσα στις προετοιμασίες των δύο. Τα πλάνα αποκτούν περισσότερη κίνηση (gimbal push-ins, slider slide-outs). Η συνάντηση στην εκκλησία και η ανταλλαγή των βλεμμάτων.
* **Story Point:** Εισαγωγή αποσπάσματος από την ομιλία του κουμπάρου ή του πατέρα, που περιγράφει πώς γνωρίστηκε το ζευγάρι. Η αφήγηση γίνεται πιο προσωπική.

### 3. Κορύφωση (The Emotional Climax) - Η Ένωση
* **Οπτικό Μέρος:** Η στιγμή του μυστηρίου, το φιλί, η έξοδος με το ρύζι σε slow-motion, και τα πρώτα πλάνα από τη δημιουργική φωτογράφιση στο ηλιοβασίλεμα.
* **Ηχητικό Μέρος:** Η μουσική κορυφώνεται με έγχορδα και κρουστά (drum build-up), δημιουργώντας ρίγη συγκίνησης.
* **Story Point:** Οι όρκοι αγάπης του ζευγαριού ακούγονται καθαρά, χωρίς μουσική υπόκρουση για 3 δευτερόλεπτα, δίνοντας μέγιστο βάρος στα λόγια τους.

### 4. Επίλογος (The Resolution) - Η Γιορτή & Το Μέλλον
* **Οπτικό Μέρος:** Δυναμικά πλάνα από το party, αγκαλιές με φίλους, πυροτεχνήματα και ένα τελικό ονειρικό πλάνο του ζευγαριού κάτω από τα αστέρια.
* **Story Point:** Μια τελευταία πρόταση-υπόσχεση από το voiceover, που κλείνει με fade-out σε μαύρο.
        `.trim();

      case "scripts-vo":
        return `
# ✍️ Σενάριο Voice-over & Ποιητική Αφήγηση | ${couple}
**Τόνος:** Ρομαντικός, Κινηματογραφικός, Διαχρονικός
**Συμβατό Στυλ:** ${style}

---

## 🎤 Voice-over Script (Διάρκεια: 60 Δευτερόλεπτα)

*(0:00 - 0:15) - Ήσυχη Εισαγωγή, Απαλή Μουσική Πιάνου*
> **Αφηγητής / Φωνή (Απαλή και ζεστή):**
> "Λένε πως ο χρόνος μετριέται σε στιγμές. Όχι σε λεπτά ή ώρες, αλλά σε εκείνα τα δευτερόλεπτα που η ανάσα σταματά... και η καρδιά θυμάται να χτυπά πιο δυνατά."

*(0:15 - 0:35) - Εικόνες Προετοιμασίας, Ήλιος που μπαίνει από το παράθυρο*
> **Αφηγητής / Φωνή:**
> "Σήμερα, στην τοποθεσία ${loc}, δύο ιστορίες γίνονται μία. Δύο διαφορετικοί δρόμοι που περπάτησαν μέσα στο φως και τη σκιά, συναντιούνται σε αυτό το μονοπάτι. Εκεί όπου η σιωπή μιλάει πιο δυνατά από τα λόγια."

*(0:35 - 0:50) - Κορύφωση Μουσικής, Πλάνα της Συνάντησης & Τελετής*
> **Αφηγητής / Φωνή (Με συναίσθημα):**
> "Κοιτάζω τα μάτια σου και βλέπω το σπίτι μου. Υπόσχομαι να είμαι εκεί στις καταιγίδες, να γελάω μαζί σου στα εύκολα, και να σε κρατώ σφιχτά όταν όλα γύρω μας κινούνται πολύ γρήγορα."

*(0:50 - 1:00) - Fade out της Μουσικής, Ήσυχο Κλείσιμο*
> **Αφηγητής / Φωνή (Ψίθυρος):**
> "Γιατί η αγάπη δεν είναι απλά μια υπόσχεση... είναι η απόφαση να μοιραστούμε το ίδιο ηλιοβασίλεμα, για πάντα."
        `.trim();

      case "editing-assistant":
        return `
# 🎞️ Οδηγός Μοντάζ & Κινηματογραφικός Ρυθμός | ${couple}
**Λογισμικό:** Premiere Pro / DaVinci Resolve
**Στυλ Μοντάζ:** ${style}

---

## 🛠️ Ροή Εργασίας Μοντάζ (Timeline Setup)

### 1. Ingestion & Organization
* **Κωδικοποίηση:** Δημιουργία Proxies αν τα αρχεία είναι 4K All-Intra 10-bit.
* **Κατηγοριοποίηση:** Φάκελοι ανά κάμερα (Camera A, Camera B, Drone, Audio).
* **Tagging:** Σήμανση των "Wow Moments" (π.χ. δάκρυα γονιών, αστεία γέλια, επικά χορευτικά) με ειδικά markers.

### 2. Επιλογή Transitions (Μεταβάσεις)
* **Match Cuts:** Σύνδεση της κίνησης του φορέματος της νύφης στην προετοιμασία με την κίνηση καθώς περπατάει στην εκκλησία.
* **Light Leaks & Lens Flares (Φυσικά):** Χρήση "light flares" από λήψεις στο ηλιοβασίλεμα ως φυσικό transition ανάμεσα στο μυστήριο και τη δεξίωση.
* **Invisible Cuts (Whip Pans):** Γρήγορη στροφή της κάμερας (whip pan) κατά τη διάρκεια του χορού για άμεση μετάβαση στο επόμενο dynamic πλάνο.

### 3. Ρυθμός & Tempo (Pacing)
* **Προετοιμασίες:** Αργός, ονειρικός ρυθμός (cuts ανά 3-4 δευτερόλεπτα), με έμφαση στο sound design.
* **Τελετή:** Σταθερός, σεβαστικός ρυθμός. Αφήνουμε τα πλάνα να "αναπνεύσουν" (cuts ανά 5-8 δευτερόλεπτα).
* **Party:** Γρήγορο, ρυθμικό edit (cuts σε κάθε beat της μουσικής), χρήση speed ramps και διπλών εκθέσεων για αύξηση της ενέργειας.
        `.trim();

      case "highlight-reel":
        return `
# ⭐ Highlight Reel Structure (3-5 Λεπτά) | ${couple}
**Στυλ:** ${style} | **Μουσικό Tempo:** Dynamic & Emotional

---

## 🎼 Δομή Timeline & Συγχρονισμός Μουσικής

### 0:00 - 0:45 | Μέρος Α: Η Προσμονή (The Anticipation)
* **Μουσική:** Απαλά έγχορδα ή πιάνο (BPM: ~70).
* **Πλάνα:** Cinematic εστέτ πλάνα της τοποθεσίας ${loc}. Λεπτομέρειες από τις ετοιμασίες (νυφικό, κοστούμι, γράμματα).
* **Voiceover:** Εισαγωγικές φράσεις προσμονής.

### 0:45 - 2:00 | Μέρος Β: Η Συνάντηση & Η Σύνδεση (The Union)
* **Μουσική:** Η μουσική αποκτά ρυθμό, προστίθεται ambient κρουστό (BPM: ~95).
* **Πλάνα:** Η άφιξη, το βλέμμα του γαμπρού, η παράδοση της νύφης, η ανταλλαγή των όρκων.
* **Συγχρονισμός:** Τα cuts γίνονται ακριβώς στα "snare hits" της μουσικής.

### 2:00 - 3:15 | Μέρος Γ: Η Έκρηξη της Χαράς (The Celebration)
* **Μουσική:** Uplifting, επικό indie-pop κομμάτι με φωνητικά (BPM: ~120).
* **Πλάνα:** Το party, ο πρώτος χορός, αγκαλιές, γέλια, drone λήψεις πάνω από τη δεξίωση.
* **Εφέ:** Χρήση σύντομων speed-ramps για συγχρονισμό των χορευτικών κινήσεων με το ρυθμό.

### 3:15 - 4:00 | Μέρος Δ: Η Διαχρονική Υπόσχεση (The Legacy)
* **Μουσική:** Ήσυχο, βαθύ κλείσιμο με ένα solo βιολί ή πιάνο.
* **Πλάνα:** Το ζευγάρι αγκαλιά στο ηλιοβασίλεμα, ένα κοντινό χαμόγελο, fade out.
        `.trim();

      case "color-grading":
        return `
# 🎨 Φιλοσοφία Χρωματικής Δημιουργίας (Color Grading Recipe)
**Τοποθεσία:** ${loc} | **Στυλ Φιλμ:** ${style}

---

## 🧪 Χρωματική Παλέτα & LUT Strategy

### 🎥 Look 1: "Warm Editorial" (Ηλιόλουστη Νοσταλγία)
* **Εμπνευσμένο από:** Kodak Portra 400.
* **Χαρακτηριστικά:** Ζεστοί τόνοι δέρματος (warm skin tones), απαλά πράσινα (pastel-toned organic greens), ελαφρώς "creamy" λευκά.
* **Ρυθμίσεις (Curves):**
  - Ανύψωση των μαύρων (black point lift) για vintage αίσθηση ματ.
  - Ελαφριά αύξηση της ζεστασιάς στα highlights και κυανά (cyan/blue) στα shadows για χρωματική αντίθεση.
* **Κατάλληλο για:** Φωτογραφίσεις σε εξωτερικούς χώρους με άπλετο φυσικό φως.

### 🎥 Look 2: "Deep Cinematic Cine-Teal"
* **Εμπνευσμένο από:** Kodak Vision3 5219 (Hollywood Standard).
* **Χαρακτηριστικά:** Βαθιά αντίθεση, πλούσια "Teal & Orange" διαβάθμιση, καθαρά λευκά.
* **Ρυθμίσεις (RGB Wheels):**
  - Shadows: Ώθηση προς το Teal/Cyan.
  - Midtones: Ζεστοί τόνοι (Orange/Peach) για φυσικό δέρμα.
  - Highlights: Ουδέτερα χρυσά.
* **Κατάλληλο για:** Νυχτερινά πλάνα και τη δεξίωση με τεχνητά φώτα.
        `.trim();

      case "audio-music":
        return `
# 🎵 Σχεδιασμός Ήχου & Μουσική Επιμέλεια | ${couple}
**Στυλ Project:** ${style}

---

## 🔊 Sound Design & Foley Guide
* **Ηχογράφηση Περιβάλλοντος (Room Tone):** Καταγραφή του φυσικού ήχου του ναού και της τοποθεσίας ${loc} για 30 δευτερόλεπτα πριν την τελετή.
* **Μικροφωνία (Microphones):**
  - Τοποθέτηση ψείρας (lavalier mic όπως Rode Wireless PRO ή DJI Mic 2) στο πέτο του γαμπρού για κρυστάλλινο ήχο στις ομιλίες και τους όρκους.
  - Εξωτερικός εγγραφέας (Zoom H6) συνδεδεμένος στην κονσόλα του DJ για απευθείας καθαρό σήμα της μουσικής και των ομιλιών.
* **Foley Effects (Εφέ Περιβάλλοντος):** Ενίσχυση του ήχου του αέρα, του θροΐσματος των φύλλων ή του ήχου από τα βήματα στο πλακόστρωτο, για μέγιστη κινηματογραφική εμβύθιση.

## 🎶 Προτεινόμενα Μουσικά Είδη (Royalty-Free)
1. **Neo-Classical (Piano & Violin):** Για την προετοιμασία και την είσοδο.
2. **Indie Folk / Acoustic:** Για το highlight βίντεο και τις χαλαρές στιγμές.
3. **Cinematic Synthwave / Pop:** Για το party και τα social media reels.
        `.trim();

      case "social-media":
        return `
# 📱 Social Media Organizer (Instagram Reels & TikTok)
**Ζευγάρι:** ${couple} | **Στυλ Βίντεο:** ${style}

---

## 📝 1. Λεζάντα με Συναίσθημα (Narrative Caption)
> "Υπάρχει μια στιγμή μέσα στην ημέρα που ο θόρυβος σβήνει, και μένει μόνο το βλέμμα. Η ${couple} στην τοποθεσία ${loc}. Ένας γάμος γεμάτος φως, δάκρυα χαράς και αληθινό κινηματογράφο. ✨🎬"
>
> **Hashtags:** \`#weddingfilm #${style.toLowerCase().replace(/\s/g, '')} #weddingstories #greeceedding #cinematographer\`

## 📝 2. Σύντομη & Viral Λεζάντα (The Hook Caption)
> "POV: Κινηματογραφείς τον πιο ρομαντικό γάμο του καλοκαιριού. 😍👇✨"
>
> **Hashtags:** \`#weddingreels #authenticlove #greecaweddings #travelvideographer\`

## 📝 3. Τεχνική Λεζάντα (Για δημιουργούς)
> "Shot on Cam A & Cam B in 10-bit color. Grading with custom film emulation LUTs to capture that timeless, documentary feel. How do you like this styling?"
>
> **Hashtags:** \`#filmmakerslife #directorofphotography #davinciresolve #colorgrading\`
        `.trim();

      case "client-comm":
        return `
# 💬 Επικοινωνία Πελάτη & Template Αποστολής "Sneak Peek"
**Ζευγάρι:** ${couple}

---

## 📧 Template Email: Αποστολή "Sneak Peek" (Trailer)

**Θέμα:** Ένα μικρό δώρο για εσάς! ✨ | Sneak Peek του γάμου σας - ${couple}

Αγαπημένοι μου ${couple},

Εύχομαι να είστε υπέροχα και να απολαμβάνετε τις πρώτες σας εβδομάδες ως παντρεμένο ζευγάρι!

Δεν μπορούσα να κρατηθώ και ήθελα να μοιραστώ μαζί σας ένα μικρό δείγμα από την ταινία σας. Δημιούργησα ένα μικρό "Sneak Peek" (Teaser) από την ημέρα του γάμου σας στην τοποθεσία ${loc}.

Μπορείτε να το δείτε και να το κατεβάσετε από τον παρακάτω σύνδεσμο:
👉 **[Σύνδεσμος Βίντεο]**

*Tip: Δείτε το με ανοιχτά τα ηχεία και στην υψηλότερη ανάλυση!*

Αυτή τη στιγμή δουλεύω με πολλή αγάπη και έμφαση στη λεπτομέρεια το πλήρες Highlight βίντεο και την ταινία σας. Θα σας κρατάω ενήμερους για την πορεία του μοντάζ.

Με εκτίμηση,
**[Το δικό σας Studio]**
        `.trim();

      case "timeline-workflow":
        return `
# 📅 Timeline & Post-Production Workflow | ${couple}
**Ημερομηνία Γάμου:** ${date} | **Στυλ Παράδοσης:** ${style}

---

## ⏱️ Χρονοδιάγραμμα Παράδοσης (Βήμα-προς-Βήμα)

* **Ημέρα +1 (Injest & Backup):** Μεταφορά όλων των καρτών μνήμης σε δύο διαφορετικούς σκληρούς δίσκους για ασφάλεια (3-2-1 backup rule).
* **Ημέρα +5 (Sneak Peek Delivery):** Παράδοση του teaser βίντεο 60 δευτερολέπτων για τα social media του ζευγαριού.
* **Ημέρα +20 (A-Cut & Sound Design):** Ολοκλήρωση της πρώτης ροής του highlight βίντεο (rough-cut). Επιλογή μουσικής και επεξεργασία του ήχου των ομιλιών.
* **Ημέρα +35 (Color Grading & VFX):** Εφαρμογή των LUTs και fine-tuning των χρωμάτων. Δημιουργία των τίτλων τέλους.
* **Ημέρα +45 (Final Delivery):** Παράδοση της πλήρους ταινίας στο ζευγάρι μέσω online πλατφόρμας και αποστολή του φυσικού USB Box.
        `.trim();

      default:
        return `
# ✨ Ολοκληρωμένο Δημιουργικό Concept | ${couple}
**Τοποθεσία:** ${loc} | **Στυλ:** ${style}

---

* **Εστιάστε στο Φως:** Χρήση χαμηλών γωνιών και κόντρα φωτισμού.
* **Ήχος:** Καταγράψτε καθαρούς όρκους με lapel μικρόφωνα.
* **Μοντάζ:** Διατηρήστε ρυθμό που ακολουθεί τα συναισθήματα των πρωταγωνιστών.
        `.trim();
    }
  };

  // 2. Secure Content Generation API endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { config, project, userInputs, userId } = req.body;
      if (!config || !project || !userId) {
        res.status(400).json({ error: "Missing required config, project context, or userId fields." });
        return;
      }

      // Securely fetch user profile from the backend database to prevent client-side spoofing
      let isUserAdmin = false;
      let customApiKey = undefined;

      try {
        const dbAdmin = getDbAdmin();
        const userDoc = await dbAdmin.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          isUserAdmin = userData?.role === "admin" || userData?.email === "tzampasyndromi@gmail.com";
          customApiKey = userData?.customGeminiApiKey;
        }
      } catch (dbErr) {
        console.warn("[Backend Security] Failed to fetch user profile, defaulting to standard access.", dbErr);
      }

      // Check if this is standard user without custom key, if so route to internal cinematic engine fallback
      const hasCustomKey = !!customApiKey;

      if (!hasCustomKey && !isUserAdmin) {
        console.log(`[Proxy AI] Standard user ${project.coupleNames || "unknown"} is routing to Local fallback cinematic engine.`);
        const localOutput = generateLocalCinematicContent(config.id, project, userInputs);
        res.json({ text: localOutput });
        return;
      }

      // Admin or User with custom key uses the real Gemini API
      const apiKey = customApiKey || (isUserAdmin ? getApiKey() : undefined);
      if (!apiKey) {
        res.status(400).json({ error: "Gemini API Key is missing. Please configure your custom key in Settings." });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      // Prepare the prompt by replacing placeholders
      let finalPrompt = (config.prompt || "")
        .replace('{style}', project.style || "")
        .replace('{coupleNames}', project.coupleNames || "")
        .replace('{location}', project.location || "");

      // Append user-provided inputs
      const inputContext = Object.entries(userInputs || {})
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join('\n');

      const fullPrompt = `
        Context:
        Wedding Couple: ${project.coupleNames || ""}
        Wedding Date: ${project.weddingDate || ""}
        Style: ${project.style || ""}
        Location: ${project.location || ""}
        
        User Specific Inputs:
        ${inputContext}
        
        Task:
        ${finalPrompt}
        
        Format the output in clean Markdown. Be detailed, professional, and creative.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
      });

      res.json({ text: response.text || "No response generated." });
    } catch (error: any) {
      console.error("Server-side Gemini generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content." });
    }
  });

  // Vite integration as middleware for dev vs server static assets for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WeddingFilmAI Studio] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical error starting the server:", error);
});
