import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
      const dbAdmin = getDbAdmin();
      const stripe = getStripe();

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId || "pro";
        
        if (userId) {
          const expiresAt = planId.endsWith("_yearly")
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : planId === "lifetime"
              ? new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            
          const stripeCustomerId = typeof session.customer === "string" ? session.customer : "";
          let stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : "";

          await dbAdmin.collection("users").doc(userId).update({
            subscriptionStatus: "active",
            subscriptionExpiresAt: expiresAt,
            stripeCustomerId: stripeCustomerId,
            stripeSubscriptionId: stripeSubscriptionId,
            subscriptionPlan: planId,
          });
          
          console.log(`[Stripe Webhook] Successfully processed checkout for user ${userId}. Plan: ${planId}`);
        }
      } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted' ||
        event.type === 'invoice.payment_failed' ||
        event.type === 'invoice.payment_succeeded'
      ) {
        const dataObj = event.data.object as any;
        const subscriptionIdStr = event.type.startsWith('invoice') ? dataObj.subscription : dataObj.id;
        
        if (typeof subscriptionIdStr === 'string') {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionIdStr);
            const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
            
            const usersSnapshot = await dbAdmin.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
            if (!usersSnapshot.empty) {
              const userRef = usersSnapshot.docs[0].ref;
              const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' :
                             subscription.status === 'past_due' || subscription.status === 'unpaid' ? 'past_due' : 'canceled';
                             
              await userRef.update({
                subscriptionStatus: status,
                subscriptionExpiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
              });
              console.log(`[Stripe Webhook] Synced subscription ${status} for user ${userRef.id}`);
            }
          } catch (e: any) {
             console.error("[Stripe Webhook] Error fetching/syncing subscription:", e);
             throw e; // re-throw to send 500
          }
        }
      }
      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Error processing event:", err);
      res.status(500).send("Database or API error while processing webhook.");
    }
  });

  // Apply Helmet for basic security controls
  app.use(helmet({
    contentSecurityPolicy: false, // Don't break inline scripts/styles for React
  }));

  // Body parser limit expanded
  app.use(express.json({ limit: "1mb" }));

  // Rate Limiting
  const apiLimiter = rateLimit({ windowMs: 60_000, max: 30 });
  const generateLimiter = rateLimit({ windowMs: 60_000, max: 10 });

  app.use("/api/stripe", apiLimiter, stripeRoutes);
  app.use("/api/generate", generateLimiter);
  app.use("/api", apiLimiter, geminiRoutes);
  app.use("/api", apiLimiter, configRoutes);

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
    
    // Daily belt-and-suspenders sync for subscriptions
    setInterval(async () => {
      try {
        console.log("[Daily Sync] Starting subscription sync...");
        const dbAdmin = getDbAdmin();
        const stripe = getStripe();
        const usersSnapshot = await dbAdmin.collection("users").where("subscriptionStatus", "in", ["active", "trialing", "past_due"]).get();
        
        for (const doc of usersSnapshot.docs) {
          const data = doc.data();
          if (data.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
            try {
              const subscriptions = await stripe.subscriptions.list({
                customer: data.stripeCustomerId,
                limit: 1,
                status: 'all'
              });
              
              if (subscriptions.data.length > 0) {
                const sub = subscriptions.data[0];
                const status = sub.status === 'active' || sub.status === 'trialing' ? 'active' :
                               sub.status === 'past_due' || sub.status === 'unpaid' ? 'past_due' : 'canceled';
                
                await doc.ref.update({
                  subscriptionStatus: status,
                  subscriptionExpiresAt: new Date(sub.current_period_end * 1000).toISOString(),
                });
              } else {
                // If they have no subscriptions in Stripe but are marked active locally
                if (data.subscriptionPlan !== "lifetime") {
                   await doc.ref.update({
                     subscriptionStatus: 'canceled'
                   });
                }
              }
            } catch (err) {
              console.error(`[Daily Sync] Failed to sync user ${doc.id}:`, err);
            }
          }
        }
        console.log("[Daily Sync] Sync complete.");
      } catch (err) {
        console.error("[Daily Sync] Error during daily sync:", err);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  });
}

startServer().catch((error) => {
  console.error("Critical error starting the server:", error);
});
