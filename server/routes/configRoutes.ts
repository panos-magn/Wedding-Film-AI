import express from "express";

const router = express.Router();

router.get("/config-status", (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  res.json({ 
    hasGeminiKey: !!key,
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY
  });
});

export default router;
