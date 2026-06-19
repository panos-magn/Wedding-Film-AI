import express from "express";
import { getStripe } from "../services/stripeService";
import { getDbAdmin } from "../services/dbAdmin";

const router = express.Router();

// Extract all stripe endpoints previously in server.ts
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { planId, userId, email, successUrl, cancelUrl } = req.body;
    if (!userId || !email) {
       res.status(400).json({ error: "Missing required fields: userId and email are mandatory." });
       return;
    }

    let amount = 4900;
    let planName = "Pro Studio (Μηνιαίο)";
    let mode: "subscription" | "payment" = "subscription";
    let recurringInterval: "month" | "year" | undefined = "month";

    if (planId === "starter_monthly") {
      amount = 1900;
      planName = "Starter Plan (Μηνιαίο)";
      mode = "subscription";
      recurringInterval = "month";
    } else if (planId === "starter_yearly") {
      amount = 18000;
      planName = "Starter Plan (Ετήσιο)";
      mode = "subscription";
      recurringInterval = "year";
    } else if (planId === "pro_monthly" || planId === "pro") {
      amount = 4900;
      planName = "Pro Studio (Μηνιαίο)";
      mode = "subscription";
      recurringInterval = "month";
    } else if (planId === "pro_yearly") {
      amount = 46800;
      planName = "Pro Studio (Ετήσιο)";
      mode = "subscription";
      recurringInterval = "year";
    } else if (planId === "lifetime") {
      amount = 29900;
      planName = "Lifetime Access";
      mode = "payment";
      recurringInterval = undefined;
    }

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
              description: mode === "subscription" 
                ? `Συνδρομή για πρόσβαση σε όλα τα AI modules του WeddingFilmAI Studio (${planName}).` 
                : "Εφάπαξ αγορά για ισόβια πρόσβαση σε όλα τα AI modules και templates.",
            },
            unit_amount: amount,
            recurring: mode === "subscription" ? { interval: recurringInterval || "month" } : undefined,
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

router.post("/verify-session", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId parameter." });
      return;
    }

    if (sessionId.startsWith("mock_session_")) {
      const parts = sessionId.split("__");
      const planId = parts[1] || "pro";
      const userId = parts[2] || "";
      
      const expiresAt = planId.endsWith("_yearly")
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : planId === "lifetime"
          ? new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      try {
        const dbAdmin = getDbAdmin();
        await dbAdmin.collection("users").doc(userId).update({
          subscriptionStatus: "active",
          subscriptionExpiresAt: expiresAt,
          subscriptionPlan: planId,
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

      const expiresAt = planId.endsWith("_yearly")
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : planId === "lifetime"
          ? new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const stripeCustomerId = typeof session.customer === "string" ? session.customer : "";
      try {
        const dbAdmin = getDbAdmin();
        await dbAdmin.collection("users").doc(userId).update({
          subscriptionStatus: "active",
          subscriptionExpiresAt: expiresAt,
          stripeCustomerId: stripeCustomerId,
          subscriptionPlan: planId,
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

router.post("/cancel-subscription", async (req, res) => {
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
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData && userData.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
          console.log(`[Stripe Cancel] Real stripe customer detected: ${userData.stripeCustomerId}`);
        }
      }

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

router.get("/invoices", async (req, res) => {
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
      res.json({ invoices: [] });
      return;
    }

    const stripe = getStripe();
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 10,
    });

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

export default router;
