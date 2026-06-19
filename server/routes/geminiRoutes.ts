import express from "express";
import { GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";
import { getDbAdmin } from "../services/dbAdmin";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { config, project, userInputs, userId, aiProvider } = req.body;
    if (!config || !project || !userId) {
      res.status(400).json({ error: "Missing required config, project context, or userId fields." });
      return;
    }

    const dbAdmin = getDbAdmin();
    const userDocRef = dbAdmin.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    let subscriptionStatus = "none";
    let subscriptionPlan = "";
    let role = "user";
    let aiCreditsUsed = 0;
    let lastCreditsResetMonth = "";

    if (userDoc.exists) {
      const userData = userDoc.data();
      subscriptionStatus = userData?.subscriptionStatus || "none";
      subscriptionPlan = userData?.subscriptionPlan || "";
      role = userData?.role || "user";
      aiCreditsUsed = userData?.aiCreditsUsed || 0;
      lastCreditsResetMonth = userData?.lastCreditsResetMonth || "";
    }

    // Determine current month in YYYY-MM format
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const isAdminUser = role === "admin";

    // 1. Check & Handle Self-Healing Reset
    if (lastCreditsResetMonth !== currentMonthStr) {
      aiCreditsUsed = 0;
      lastCreditsResetMonth = currentMonthStr;
      try {
        await userDocRef.update({
          aiCreditsUsed: 0,
          lastCreditsResetMonth: currentMonthStr,
        });
      } catch (err) {
        console.error("Failed to reset credits in DB:", err);
      }
    }

    // 2. Determine monthly credit limit based on user subscription
    let limit = 3; // default trial for trialing/none/canceled
    if (isAdminUser) {
      limit = 999999;
    } else if (subscriptionStatus === "active") {
      if (subscriptionPlan === "starter_monthly" || subscriptionPlan === "starter_yearly") {
        limit = 30;
      } else if (subscriptionPlan === "lifetime") {
        limit = 500;
      } else {
        // default active or pro
        limit = 150;
      }
    }

    // 3. Check if credit limit has been exceeded
    if (!isAdminUser && aiCreditsUsed >= limit) {
      res.status(403).json({
        error: `Έχετε εξαντλήσει το μηνιαίο όριο παραγωγής AI (${limit} credits) για το πλάνο σας (${subscriptionPlan === "starter_monthly" || subscriptionPlan === "starter_yearly" ? "Starter" : subscriptionPlan === "lifetime" ? "Lifetime" : "Pro"}). Παρακαλούμε αναβαθμίστε τη συνδρομή σας ή περιμένετε τον επόμενο μήνα για ανανέωση των credits σας.`,
        aiCreditsUsed,
        aiCreditsLimit: limit,
      });
      return;
    }

    const provider = aiProvider || "gemini";
    
    let finalPrompt = (config.prompt || "")
      .replace('{style}', project.style || "")
      .replace('{coupleNames}', project.coupleNames || "")
      .replace('{location}', project.location || "");

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

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY?.trim();

      if (!apiKey) {
        res.status(400).json({ error: "Το OpenAI API Key του συστήματος απουσιάζει. Παρακαλούμε επικοινωνήστε με τον διαχειριστή." });
        return;
      }

      console.log(`[Proxy AI] Generating content using OpenAI model gpt-4o-mini using system key for user ${userId}`);

      try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an elite wedding videography assistant. Generate professional, creative, and inspiring wedding film structures, storytelling ideas, timelines, or scripts in Greek or English based on the input context. Format with beautiful, clean markdown.",
            },
            {
              role: "user",
              content: fullPrompt,
            }
          ],
          temperature: 0.7,
        });

        const generatedText = response.choices[0]?.message?.content || "No response generated.";
        
        // Record credit used
        let nextCreditsUsed = aiCreditsUsed;
        if (!isAdminUser) {
          nextCreditsUsed = aiCreditsUsed + 1;
          await userDocRef.update({
            aiCreditsUsed: nextCreditsUsed,
          });
        }

        res.json({ 
          text: generatedText,
          aiCreditsUsed: nextCreditsUsed,
          aiCreditsLimit: limit
        });
        return;
      } catch (openAiErr: any) {
        console.error("[OpenAI API Error] Failed to generate content:", openAiErr);
        const errMsg = openAiErr?.message || "";
        let friendlyMsg = "Το μοντέλο OpenAI απέτυχε να παράγει αποτελέσματα. Δοκιμάστε ξανά αργότερα.";
        if (errMsg.includes("insufficient_quota") || errMsg.includes("429") || errMsg.includes("rate_limit")) {
          friendlyMsg = "Το σύστημα έχει υπερβεί το όριο χρήσης OpenAI ή έχει εξαντληθεί το υπόλοιπο (Quota Exceeded). Δοκιμάστε το Google Gemini API ή επικοινωνήστε με την υποστήριξη.";
        } else if (errMsg.includes("invalid_api_key") || errMsg.includes("401") || errMsg.includes("incorrect_api_key") || errMsg.includes("Invalid API Key")) {
          friendlyMsg = "Το κλειδί OpenAI του συστήματος δεν είναι έγκυρο. Παρακαλώ επικοινωνήστε με τους διαχειριστές.";
        }
        res.status(503).json({ error: friendlyMsg });
        return;
      }
    } else {
      // Gemini mode
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      
      if (!apiKey) {
        res.status(400).json({ error: "Το Google Gemini API Key του συστήματος απουσιάζει. Παρακαλούμε επικοινωνήστε με τον διαχειριστή." });
        return;
      }
      
      console.log(`[Proxy AI] Generating content using Gemini model gemini-3.5-flash using system key for user ${userId}`);

      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: fullPrompt,
        });

        const generatedText = response.text || "No response generated.";

        // Record credit used
        let nextCreditsUsed = aiCreditsUsed;
        if (!isAdminUser) {
          nextCreditsUsed = aiCreditsUsed + 1;
          await userDocRef.update({
            aiCreditsUsed: nextCreditsUsed,
          });
        }

        res.json({ 
          text: generatedText,
          aiCreditsUsed: nextCreditsUsed,
          aiCreditsLimit: limit
        });
        return;
      } catch (genErr: any) {
        console.error("[Gemini API Error] Failed to generate content:", genErr);
        const errMsg = genErr?.message || "";
        let friendlyMsg = "Το μοντέλο AI απέτυχε να παράγει αποτελέσματα. Δοκιμάστε ξανά αργότερα.";
        if (errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          friendlyMsg = "Το κλειδί Gemini του συστήματος έχει υπερβεί το όριο χρήσης. Δοκιμάστε ξανά σε λίγο ή αλλάξτε πάροχο σε OpenAI.";
        } else if (errMsg.includes("INVALID_API_KEY") || errMsg.includes("403") || errMsg.includes("API key not valid") || errMsg.includes("400")) {
          friendlyMsg = "Το κλειδί Gemini του συστήματος δεν είναι έγκυρο. Παρακαλώ επικοινωνήστε με τους διαχειριστές.";
        } else if (errMsg.includes("timeout")) {
          friendlyMsg = "Η δημιουργία αποτελέσματος πήρε πολύ χρόνο. Προσπαθήστε να μειώσετε τα δεδομένα εσόδου.";
        }
        res.status(503).json({ error: friendlyMsg });
        return;
      }
    }
  } catch (error: any) {
    console.error("Server-side AI generation error:", error);
    res.status(500).json({ error: error.message || "Γενικό σφάλμα διακομιστή στην δημιουργία AI." });
  }
});

export default router;
