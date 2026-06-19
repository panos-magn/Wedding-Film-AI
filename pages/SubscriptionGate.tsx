import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  Flame,
  Star,
  ShieldCheck,
  Heart,
  LogOut,
} from "lucide-react";
import { logoutUser, auth } from "../services/firebase";

interface SubscriptionGateProps {
  userEmail: string;
  onLogout: () => void;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  userEmail,
  onLogout,
}) => {
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const [hasStripeKey, setHasStripeKey] = React.useState<boolean>(false);
  const [billingInterval, setBillingInterval] = React.useState<"monthly" | "yearly">("monthly");

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/config-status", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data && typeof data.hasStripeKey === "boolean") {
          setHasStripeKey(data.hasStripeKey);
        }
      } catch (err) {
        console.error("Error fetching stripe config status on Paywall:", err);
      }
    };
    fetchConfig();
  }, []);

  const plans = [
    {
      id: "starter",
      name: "Starter Plan",
      price: billingInterval === "monthly" ? "€19" : "€15",
      period: "μήνα",
      stripeId: billingInterval === "monthly" ? "starter_monthly" : "starter_yearly",
      subtitle: billingInterval === "monthly" ? "Χρέωση ανά μήνα" : "Χρέωση €180/έτος (-21%)",
      description:
        "Ιδανικό για νέους wedding filmmakers που ξεκινούν το ταξίδι τους.",
      features: [
        "Έως 5 Ενεργά Projects",
        "Όλα τα AI Modules (Βασική Ταχύτητα)",
        "Δημιουργία & Εξαγωγή Συμβολαίων",
        "Email Support",
      ],
      badge: "ΒΑΣΙΚΟ",
      color:
        "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400",
      btnStyle: "bg-slate-800 hover:bg-slate-700 text-white",
    },
    {
      id: "pro",
      name: "Pro Studio",
      price: billingInterval === "monthly" ? "€49" : "€39",
      period: "μήνα",
      stripeId: billingInterval === "monthly" ? "pro_monthly" : "pro_yearly",
      subtitle: billingInterval === "monthly" ? "Χρέωση ανά μήνα" : "Χρέωση €468/έτος (-20%)",
      description: "Η κορυφαία επιλογή για επαγγελματίες με συνεχή ροή έργων.",
      features: [
        "Απεριόριστα Active Projects",
        "Ultra-Fast AI Generation Priority",
        "Smart PDF Exporter & Branding",
        "Προσαρμοσμένα Στυλ & Tone of Voice",
        "VIP WhatsApp & Email Support",
      ],
      badge: "ΔΗΜΟΦΙΛΕΣ",
      popular: true,
      color:
        "from-indigo-600/30 to-purple-600/20 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10",
      btnStyle:
        "bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-indigo-500/30",
    },
    {
      id: "lifetime",
      name: "Lifetime Access",
      price: "€299",
      period: "εφάπαξ",
      stripeId: "lifetime",
      subtitle: "Μία πληρωμή για πάντα",
      description:
        "Για καθιερωμένα studios βιντεοσκόπησης που θέλουν μόνιμη πρόσβαση.",
      features: [
        "Όλα τα προνόμια του Pro Studio",
        "Μία πληρωμή για ΠΑΝΤΑ",
        "Δια βίου ενημερώσεις λογισμικού",
        "Αποκλειστικά custom AI GPT prompts",
        "1-on-1 Onboarding Call",
      ],
      badge: "ΚΑΛΥΤΕΡΗ ΑΞΙΑ",
      color:
        "from-pink-500/20 to-purple-500/10 border-pink-500/30 text-pink-400",
      btnStyle: "bg-slate-800 hover:bg-slate-700 text-white",
    },
  ];

  const handleSimulatePayment = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Δεν βρέθηκε συνδεδεμένος χρήστης.");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planId,
          userId: currentUser.uid,
          email: currentUser.email || userEmail,
          successUrl: window.location.origin + window.location.pathname,
          cancelUrl: window.location.origin + window.location.pathname,
        }),
      });

      if (!response.ok) {
        throw new Error("Αποτυχία κατά την έναρξη της πληρωμής.");
      }

      const data = await response.json();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Δεν προέκυψε σύνδεσμος Stripe Checkout.");
      }
    } catch (err: any) {
      console.error("Stripe paywall error:", err);
      alert(
        err.message || "Σφάλμα κατά την επικοινωνία με την υπηρεσία Stripe.",
      );
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden flex flex-col justify-between p-6">
      {/* Background ambient orbs */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            W
          </div>
          <span className="font-serif font-bold text-lg text-slate-50">
            WeddingFilmAI Studio
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-400 transition-colors bg-slate-900/50 border border-slate-800 py-2.5 px-4 rounded-xl"
        >
          <LogOut size={14} />
          Αποσύνδεση
        </button>
      </header>

      {/* Main paywall area */}
      <main className="relative z-10 max-w-5xl mx-auto w-full py-12 flex flex-col items-center gap-10 text-center">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={12} className="animate-pulse" />
            Premium Πρόσβαση
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-50 font-serif tracking-tight">
            Απελευθερώστε τη Δύναμη της{" "}
            <span className="text-indigo-400 font-sans">AI</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Η δοκιμαστική σας περίοδος έληξε ή δεν έχετε ενεργή συνδρομή.
            Επιλέξτε το πακέτο που σας ταιριάζει και αποκτήστε άμεση πρόσβαση
            στα εργαλεία δημιουργίας σεναρίων και σχεδιασμού ταινιών γάμου.
          </p>
          <p className="text-slate-500 text-xs italic">
            Συνδεδεμένος λογαριασμός:{" "}
            <span className="text-slate-400 font-semibold">{userEmail}</span>
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-[2rem] w-fit mx-auto relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`py-3 px-8 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
              billingInterval === "monthly"
                ? "bg-indigo-600 text-slate-50 shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Μηνιαία Χρέωση
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`py-3 px-8 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              billingInterval === "yearly"
                ? "bg-indigo-600 text-slate-50 shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Ετήσια Χρέωση</span>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-extrabold normal-case leading-none">
              Save 20%
            </span>
          </button>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
          {plans.map((plan) => (
            <motion.div
              key={plan.stripeId}
              whileHover={{ y: -6 }}
              className={`relative rounded-[2rem] p-8 border backdrop-blur-md bg-slate-950/40 flex flex-col justify-between text-left ${
                plan.popular ? "border-indigo-500/40" : "border-slate-800/60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[9px] font-bold tracking-widest px-3 py-1 rounded-full border bg-slate-900/80 ${plan.color}`}
                  >
                    {plan.badge}
                  </span>
                  {plan.popular && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <Star size={10} className="fill-amber-400" /> Best Seller
                    </span>
                  )}
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-xl font-bold text-slate-50">
                    {plan.name}
                  </h3>
                  <p className="text-slate-400 text-xs h-10">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8 pb-6 border-b border-slate-900">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-50">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-xs font-semibold">
                      / {plan.period}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1.5 tracking-wide">
                    {plan.subtitle}
                  </p>
                </div>

                {/* Features list */}
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-300"
                    >
                      <div className="w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mt-0.5 flex-shrink-0">
                        <Check size={10} className="stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                disabled={loadingPlan !== null}
                onClick={() => handleSimulatePayment(plan.stripeId)}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-xs transition-all tracking-wider uppercase active:scale-[0.98] ${plan.btnStyle}`}
              >
                {loadingPlan === plan.stripeId ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Επεξεργασία...</span>
                  </div>
                ) : hasStripeKey ? (
                  "Εγγραφη με Stripe"
                ) : (
                  "Εγγραφη (Sandbox)"
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Extra guarantees info footer */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-500" />
            <span>Ακύρωση ανά πάσα στιγμή</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={16} className="text-indigo-500" />
            <span>Ασφαλείς συναλλαγές με Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-indigo-500" />
            <span>24/7 Premium Support</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full text-center py-6 text-[10px] text-slate-600 uppercase font-bold tracking-widest border-t border-slate-900 flex items-center justify-center gap-1 mt-12">
        Crafted with <Heart size={10} className="text-rose-500 fill-rose-500" />{" "}
        for creative wedding builders
      </footer>
    </div>
  );
};

export default SubscriptionGate;
