import Stripe from "stripe";

let stripeInstance: any = null;

export const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required.");
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia" as any,
    });
  }
  return stripeInstance;
};
