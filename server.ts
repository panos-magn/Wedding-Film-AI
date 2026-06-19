import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDbAdmin } from "./server/services/dbAdmin";
import { getStripe } from "./server/services/stripeService";
import stripeRoutes from "./server/routes/stripeRoutes";
import geminiRoutes from "./server/routes/geminiRoutes";
import configRoutes from "./server/routes/configRoutes";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // --- PRODUCTION STRIPE WEBHOOKS ---
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const rawBody = req.body;
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret || !sig) {
      console.warn("[Stripe Webhook] Stripe Webhook called but STRIPE_WEBHOOK_SECRET is not configured.");
      res.status(400).send("Webhook secret not configured.");
      return;
    }

    let event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(rawBody, sig as string, endpointSecret);
    } catch (err: any) {
      console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId || "pro";
        
        if (userId) {
          const dbAdmin = getDbAdmin();
          const expiresAt = planId === "pro"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString();
            
          const stripeCustomerId = typeof session.customer === "string" ? session.customer : "";

          await dbAdmin.collection("users").doc(userId).update({
            subscriptionStatus: "active",
            subscriptionExpiresAt: expiresAt,
            stripeCustomerId: stripeCustomerId,
            subscriptionPlan: planId,
          });
          
          console.log(`[Stripe Webhook] Successfully processed checkout for user ${userId}. Plan: ${planId}`);
        }
      }
      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Error processing event:", err);
      res.status(200).send("Error updating DB but webhook received.");
    }
  });

  // Body parser limit expanded
  app.use(express.json({ limit: "10mb" }));

  // Routes
  app.use("/api/stripe", stripeRoutes);
  app.use("/api", geminiRoutes);
  app.use("/api", configRoutes);

  // Vite integration as middleware
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
