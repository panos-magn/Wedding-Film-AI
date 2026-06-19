import * as React from "react";
import { useState, useEffect } from "react";
import { UserProfile, Invoice } from "../types";
import {
  User,
  Shield,
  Palette,
  FileText,
  Check,
  Globe,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Type,
  Menu,
  ChevronDown,
  Sparkles,
  CreditCard,
  Download,
  Receipt,
} from "lucide-react";
import { auth } from "../services/firebase";

interface SettingsProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onLocalProfileUpdate?: (p: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({
  profile,
  onUpdateProfile,
  onLocalProfileUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "branding" | "contracts" | "api" | "sandbox" | "billing"
  >("profile");
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [hasOpenAiKey, setHasOpenAiKey] = useState<boolean>(false);
  const [hasStripeKey, setHasStripeKey] = useState<boolean>(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
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
        if (data) {
          if (typeof data.hasGeminiKey === "boolean") {
            setHasGeminiKey(data.hasGeminiKey);
          }
          if (typeof data.hasOpenAiKey === "boolean") {
            setHasOpenAiKey(data.hasOpenAiKey);
          }
          if (typeof data.hasStripeKey === "boolean") {
            setHasStripeKey(data.hasStripeKey);
          }
        }
      } catch (err) {
        console.error("Error fetching api key status on Settings:", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (
      activeTab === "billing" &&
      localProfile.stripeCustomerId &&
      hasStripeKey
    ) {
      setLoadingInvoices(true);
      const fetchInvoices = async () => {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) throw new Error("No user");
          const token = await currentUser.getIdToken();
          const res = await fetch(
            `/api/stripe/invoices?userId=${currentUser.uid}&stripeCustomerId=${localProfile.stripeCustomerId || ""}`,
            {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            }
          );
          const data = await res.json();
          if (data.invoices) {
            setInvoices(data.invoices);
          }
        } catch (err) {
          console.error("Error fetching invoices:", err);
        } finally {
          setLoadingInvoices(false);
        }
      };
      fetchInvoices();
    }
  }, [activeTab, localProfile.stripeCustomerId, hasStripeKey]);

  const handleStripeCheckout = async (planId: string) => {
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
          email: currentUser.email || profile.email,
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
      console.error("Stripe integration error:", err);
      alert(
        err.message || "Σφάλμα κατά την επικοινωνία με την υπηρεσία Stripe.",
      );
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !window.confirm("Είστε σίγουροι ότι θέλετε να ακυρώσετε τη συνδρομή σας;")
    ) {
      return;
    }

    setLoadingPlan("cancel");
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Δεν βρέθηκε συνδεδεμένος χρήστης.");
      }
      
      const token = await currentUser.getIdToken();

      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          stripeCustomerId: localProfile.stripeCustomerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Αποτυχία κατά την ακύρωση της συνδρομής.");
      }

      const data = await response.json();
      if (data && data.success) {
        const updated = {
          ...localProfile,
          subscriptionStatus: "canceled" as const,
        };
        setLocalProfile(updated);
        if (onLocalProfileUpdate) {
          onLocalProfileUpdate(updated);
        }

        // Client DB update is handled via onLocalProfileUpdate at the app level.
        // No need to run direct DB queries here.
      } else {
        throw new Error("Δεν ολοκληρώθηκε η ακύρωση.");
      }
    } catch (err: any) {
      console.error("Cancel subscription error:", err);
      alert(err.message || "Σφάλμα κατά την ακύρωση της συνδρομής.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSave = () => {
    onUpdateProfile(localProfile);
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-8 py-5 border-b-2 transition-all font-bold uppercase text-[10px] tracking-[0.2em] shrink-0 whitespace-nowrap ${
        activeTab === id
          ? "border-indigo-500 text-white bg-indigo-500/5"
          : "border-transparent text-slate-500 hover:text-slate-200"
      }`}
    >
      <Icon size={18} className={activeTab === id ? "text-indigo-400" : ""} />
      {label}
    </button>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto pb-24 lg:pb-0 w-full min-w-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold font-serif text-slate-50 tracking-tight">
            Ρυθμίσεις
          </h2>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">
            Manage your studio profile & brand
          </p>
        </div>
        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-[2rem] font-bold transition-all shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3 w-full md:w-auto active:scale-95"
        >
          <Check size={24} />
          <span>Αποθήκευση Αλλαγών</span>
        </button>
      </header>

      <div className="bg-slate-900/40 border border-slate-800/50 rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-600/5">
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-800/50 bg-slate-950/30">
          <TabButton id="profile" label="Studio Profile" icon={User} />
          <TabButton id="branding" label="Brand Identity" icon={Palette} />
          <TabButton
            id="contracts"
            label="Contract Templates"
            icon={FileText}
          />
          <TabButton id="api" label="AI Credits & Models" icon={Sparkles} />
          {profile.role === "admin" ? (
            <TabButton id="sandbox" label="Developer Sandbox" icon={Sparkles} />
          ) : (
            <TabButton
              id="billing"
              label="Συνδρομή & Πληρωμές"
              icon={CreditCard}
            />
          )}
        </div>

        <div className="p-8 md:p-12">
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] ml-2">
                  <User size={14} className="text-indigo-500" /> Full Name
                </label>
                <input
                  type="text"
                  value={localProfile.fullName}
                  onChange={(e) =>
                    setLocalProfile({
                      ...localProfile,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 border border-slate-800 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] ml-2">
                  <Globe size={14} className="text-indigo-500" /> Studio Name
                </label>
                <input
                  type="text"
                  value={localProfile.businessName}
                  onChange={(e) =>
                    setLocalProfile({
                      ...localProfile,
                      businessName: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 border border-slate-800 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] ml-2">
                  <Mail size={14} className="text-indigo-500" /> Business Email
                </label>
                <input
                  type="email"
                  value={localProfile.email}
                  onChange={(e) =>
                    setLocalProfile({ ...localProfile, email: e.target.value })
                  }
                  className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 border border-slate-800 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] ml-2">
                  <Phone size={14} className="text-indigo-500" /> Contact Phone
                </label>
                <input
                  type="text"
                  value={localProfile.phone}
                  onChange={(e) =>
                    setLocalProfile({ ...localProfile, phone: e.target.value })
                  }
                  className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 border border-slate-800 transition-all"
                />
              </div>
              <div className="space-y-4 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] ml-2">
                  <MapPin size={14} className="text-indigo-500" /> Studio
                  Address
                </label>
                <input
                  type="text"
                  value={localProfile.address}
                  onChange={(e) =>
                    setLocalProfile({
                      ...localProfile,
                      address: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 border border-slate-800 transition-all"
                />
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
                    Primary Color
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={localProfile.brandColors.primary}
                      onChange={(e) =>
                        setLocalProfile({
                          ...localProfile,
                          brandColors: {
                            ...localProfile.brandColors,
                            primary: e.target.value,
                          },
                        })
                      }
                      className="w-20 h-20 rounded-[1.5rem] cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={localProfile.brandColors.primary}
                      className="flex-1 bg-slate-950/50 p-5 rounded-2xl text-sm font-mono text-slate-400 border border-slate-800"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
                    Secondary
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={localProfile.brandColors.secondary}
                      onChange={(e) =>
                        setLocalProfile({
                          ...localProfile,
                          brandColors: {
                            ...localProfile.brandColors,
                            secondary: e.target.value,
                          },
                        })
                      }
                      className="w-20 h-20 rounded-[1.5rem] cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={localProfile.brandColors.secondary}
                      className="flex-1 bg-slate-950/50 p-5 rounded-2xl text-sm font-mono text-slate-400 border border-slate-800"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
                    Accent
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={localProfile.brandColors.accent}
                      onChange={(e) =>
                        setLocalProfile({
                          ...localProfile,
                          brandColors: {
                            ...localProfile.brandColors,
                            accent: e.target.value,
                          },
                        })
                      }
                      className="w-20 h-20 rounded-[1.5rem] cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={localProfile.brandColors.accent}
                      className="flex-1 bg-slate-950/50 p-5 rounded-2xl text-sm font-mono text-slate-400 border border-slate-800"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] ml-2">
                    <Type size={14} className="text-indigo-500" /> Document Font
                  </label>
                  <div className="relative group">
                    <select className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 appearance-none border border-slate-800 group-hover:border-slate-700 transition-all">
                      <option>Inter (Sans Serif)</option>
                      <option>Playfair Display (Serif)</option>
                      <option>Montserrat</option>
                      <option>Cormorant Garamond</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 pointer-events-none">
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em] ml-2">
                    <Globe size={14} className="text-indigo-500" /> Language
                    Preference
                  </label>
                  <div className="relative group">
                    <select className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 appearance-none border border-slate-800 group-hover:border-slate-700 transition-all">
                      <option>Ελληνικά (GR)</option>
                      <option>English (US)</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 pointer-events-none">
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-12 rounded-[3rem] border-2 border-dashed border-slate-800 bg-slate-950/30 flex flex-col items-center justify-center space-y-8 group hover:border-indigo-500/30 transition-all">
                <div className="w-28 h-28 rounded-[2rem] bg-slate-900 flex items-center justify-center text-slate-700 shadow-inner group-hover:text-indigo-400 group-hover:bg-indigo-500/5 transition-all">
                  <Palette size={56} />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-bold text-2xl text-slate-50 font-serif">
                    Studio Logo
                  </p>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                    Recommended 512x512px (SVG or PNG)
                  </p>
                </div>
                <button className="px-10 py-5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded-[1.5rem] text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest active:scale-95">
                  Upload Logo
                </button>
              </div>
            </div>
          )}

          {activeTab === "contracts" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]">
                    <FileText size={14} className="text-indigo-500" /> Service
                    Agreement Template
                  </label>
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full">
                    Supports Markdown
                  </span>
                </div>
                <textarea
                  value={localProfile.contractTemplate}
                  onChange={(e) =>
                    setLocalProfile({
                      ...localProfile,
                      contractTemplate: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950/50 p-10 rounded-[3rem] min-h-[500px] outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm leading-relaxed border border-slate-800 transition-all text-slate-300 placeholder:text-slate-700"
                  placeholder="Insert your contract terms here..."
                />
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 max-w-2xl">
              <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[3rem] space-y-8">
                <div className="space-y-3">
                  <h4 className="font-bold text-indigo-400 uppercase tracking-[0.2em] text-xs font-sans">
                    AI Credits & Usage
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Διαχειριστείτε τα credits χρήσης AI και επιλέξτε το προτιμώμενο μοντέλο παραγωγής. Όλα τα αιτήματα AI διεκπεραιώνονται με ασφάλεια μέσω των δικών μας premium, εξαιρετικά σταθερών διακομιστών. <strong>Δεν απαιτείται να εισάγετε δικά σας κλειδιά (API Keys).</strong>
                  </p>
                </div>

                {/* Credits Progress Visual */}
                <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800 space-y-4 font-sans">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Μηνιαία Χρήση AI Credits</p>
                      <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                        Πλάνο: {
                          localProfile.role === "admin"
                            ? "Διαχειριστής (Admin)"
                            : (localProfile.subscriptionStatus === "active"
                                ? (localProfile.subscriptionPlan === "starter_monthly" || localProfile.subscriptionPlan === "starter_yearly"
                                    ? "Starter Plan"
                                    : localProfile.subscriptionPlan === "lifetime"
                                      ? "Lifetime Access"
                                      : "Pro Studio")
                                : "Δωρεάν Δοκιμή (Trial)")
                        }
                      </h5>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-slate-50 font-mono">
                        {localProfile.role === "admin" ? "∞" : localProfile.aiCreditsUsed || 0}
                      </span>
                      <span className="text-slate-500 font-bold font-mono">
                        {localProfile.role === "admin"
                          ? ""
                          : ` / ${
                              localProfile.subscriptionStatus === "active"
                                ? localProfile.subscriptionPlan === "starter_monthly" || localProfile.subscriptionPlan === "starter_yearly"
                                  ? 30
                                  : localProfile.subscriptionPlan === "lifetime"
                                    ? 500
                                    : 150
                                : 3
                            }`}
                      </span>
                      <p className="text-[10px] text-slate-500">Credits used</p>
                    </div>
                  </div>

                  {localProfile.role !== "admin" && (
                    <div className="space-y-1.5">
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              (((localProfile.aiCreditsUsed || 0) / (
                                localProfile.subscriptionStatus === "active"
                                  ? localProfile.subscriptionPlan === "starter_monthly" || localProfile.subscriptionPlan === "starter_yearly"
                                    ? 30
                                    : localProfile.subscriptionPlan === "lifetime"
                                      ? 500
                                      : 150
                                  : 3
                              )) * 100)
                            )}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Provider Switcher */}
                <div className="space-y-4 border-t border-slate-900 pt-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
                      Επιλογή Προτιμώμενου Μοντέλου AI (Provider)
                    </label>
                    <p className="text-[11px] text-slate-400 leading-relaxed ml-2">
                      Επιλέξτε ποιο μοντέλο AI θα χρησιμοποιηθεί ως προεπιλογή για την παραγωγή σεναρίων και δομών.
                    </p>
                  </div>
                  <div className="flex p-1 bg-slate-950/80 border border-slate-800 rounded-2xl w-fit">
                    <button
                      type="button"
                      onClick={() =>
                        setLocalProfile({
                          ...localProfile,
                          aiProvider: "gemini",
                        })
                      }
                      className={`py-2 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        (localProfile.aiProvider || "gemini") === "gemini"
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Google Gemini 3.5 Flash
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalProfile({
                          ...localProfile,
                          aiProvider: "openai",
                        })
                      }
                      className={`py-2 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        localProfile.aiProvider === "openai"
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      OpenAI GPT-4o-mini
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium italic ml-2 leading-relaxed">
                    { (localProfile.aiProvider || "gemini") === "gemini" 
                      ? "✓ Το Google Gemini 3.5 Flash προσφέρει εξαιρετική δημιουργικότητα και λεπτομέρεια, ειδικό για δομές κινηματογράφησης γάμων."
                      : "✓ Το OpenAI GPT-4o-mini προσφέρει κορυφαία ακρίβεια, γοργή απόκριση και εξαιρετική σύνταξη κειμένων."
                    }
                  </p>
                </div>

                {/* Info Box about billing integration */}
                <div className="border-t border-slate-900 pt-6 text-[11px] text-slate-500 space-y-2 leading-relaxed ml-2">
                  <p>
                    💡 <strong>Reset Credits:</strong> Τα AI credits σας επαναφέρονται αυτόματα την 1η ημέρα κάθε ημερολογιακού μήνα.
                  </p>
                  <p>
                    🚀 <strong>Χρειάζεστε περισσότερα credits;</strong> Αναβαθμίστε το πλάνο σας άμεσα από την καρτέλα <strong>Συνδρομή & Πληρωμές</strong> παραπάνω για να αυξήσετε το μηνιαίο όριο παραγωγής σας.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sandbox" && profile.role === "admin" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 max-w-2xl">
              <div className="bg-purple-600/5 border border-purple-500/20 p-8 rounded-[3rem] space-y-6">
                <div>
                  <h4 className="font-bold text-purple-400 uppercase tracking-widest text-xs">
                    Simulated Sandbox Environment
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Χρησιμοποιήστε αυτό το πάνελ για να αλλάξετε άμεσα τις
                    ιδιότητες του προφίλ σας και να ελέγξετε πώς ανταποκρίνεται
                    η εφαρμογή (paywall, admin views κλπ).
                  </p>
                </div>

                {/* Simulated Role Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Προσομοιωση Ρολου
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localProfile,
                          role: "user" as const,
                        };
                        setLocalProfile(updated);
                        onUpdateProfile(updated);
                      }}
                      className={`py-3 px-4 rounded-xl text-xs font-bold uppercase transition-all border ${
                        localProfile.role === "user" || !localProfile.role
                          ? "bg-slate-950 border-purple-500/50 text-purple-400"
                          : "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      User (Απλος Χρηστης)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localProfile,
                          role: "admin" as const,
                        };
                        setLocalProfile(updated);
                        onUpdateProfile(updated);
                      }}
                      className={`py-3 px-4 rounded-xl text-xs font-bold uppercase transition-all border ${
                        localProfile.role === "admin"
                          ? "bg-slate-950 border-purple-500/50 text-purple-400"
                          : "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      Admin (Διαχειριστης)
                    </button>
                  </div>
                </div>

                {/* Simulated Subscription Status */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Κατασταση Συνδρομης
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localProfile,
                          subscriptionStatus: "trialing" as const,
                          subscriptionExpiresAt: new Date(
                            Date.now() + 14 * 24 * 60 * 60 * 1000,
                          ).toISOString(),
                        };
                        setLocalProfile(updated);
                        onUpdateProfile(updated);
                      }}
                      className={`py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border truncate ${
                        localProfile.subscriptionStatus === "trialing"
                          ? "bg-slate-950 border-purple-500/50 text-purple-400"
                          : "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      Trialing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localProfile,
                          subscriptionStatus: "active" as const,
                          subscriptionPlan: "pro",
                          subscriptionExpiresAt: new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000,
                          ).toISOString(),
                        };
                        setLocalProfile(updated);
                        onUpdateProfile(updated);
                      }}
                      className={`py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border truncate ${
                        localProfile.subscriptionStatus === "active" && (localProfile.subscriptionPlan === "pro" || !localProfile.subscriptionPlan)
                          ? "bg-slate-950 border-purple-500/50 text-purple-400"
                          : "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      Active Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localProfile,
                          subscriptionStatus: "active" as const,
                          subscriptionPlan: "starter_monthly",
                          subscriptionExpiresAt: new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000,
                          ).toISOString(),
                        };
                        setLocalProfile(updated);
                        onUpdateProfile(updated);
                      }}
                      className={`py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border truncate ${
                        localProfile.subscriptionStatus === "active" && localProfile.subscriptionPlan === "starter_monthly"
                          ? "bg-slate-950 border-purple-500/50 text-purple-400"
                          : "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      Active Starter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localProfile,
                          subscriptionStatus: "active" as const,
                          subscriptionPlan: "lifetime",
                          subscriptionExpiresAt: new Date(
                            Date.now() + 3650 * 24 * 60 * 60 * 1000,
                          ).toISOString(),
                        };
                        setLocalProfile(updated);
                        onUpdateProfile(updated);
                      }}
                      className={`py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border truncate ${
                        localProfile.subscriptionStatus === "active" && localProfile.subscriptionPlan === "lifetime"
                          ? "bg-slate-950 border-purple-500/50 text-purple-400"
                          : "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      Active Lifetime
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localProfile,
                          subscriptionStatus: "none" as const,
                          subscriptionPlan: "",
                          subscriptionExpiresAt: "",
                        };
                        setLocalProfile(updated);
                        onUpdateProfile(updated);
                      }}
                      className={`py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border truncate ${
                        localProfile.subscriptionStatus === "none" ||
                        !localProfile.subscriptionStatus
                          ? "bg-slate-950 border-purple-500/50 text-purple-400"
                          : "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      No Plan
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    💡 Επιλέγοντας &quot;No Plan&quot;, θα ενεργοποιηθεί άμεσα
                    το Paywall για να δοκιμάσετε την οθόνη αγοράς.
                  </p>
                </div>

                {/* Simulated AI Credits */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Προσομοιωση AI Credits
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={localProfile.aiCreditsUsed || 0}
                      onChange={(e) => {
                        const updated = {
                          ...localProfile,
                          aiCreditsUsed: parseInt(e.target.value, 10),
                        };
                        setLocalProfile(updated);
                        onUpdateProfile(updated);
                      }}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="text-sm font-bold text-purple-400 font-mono w-12 text-right">
                      {localProfile.aiCreditsUsed || 0}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    💡 Αυξήστε τη χρήση των Credits για να δοκιμάσετε τη συμπεριφορά του paywall και των ορίων AI παραγωγής.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && profile.role !== "admin" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current plan card */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-6 rounded-[2rem] flex flex-col justify-between md:col-span-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                        Η Συνδρομή σας
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xl font-bold font-serif text-slate-50">
                          {localProfile.subscriptionStatus === "active" &&
                            "Pro Studio"}
                          {localProfile.subscriptionStatus === "trialing" &&
                            "Δοκιμαστικό Πλάνο (Trial)"}
                          {localProfile.subscriptionStatus === "none" &&
                            "Κανένα Ενεργό Πλάνο"}
                          {localProfile.subscriptionStatus === "canceled" &&
                            "Ακυρωμένο Πλάνο"}
                          {!localProfile.subscriptionStatus &&
                            "Δεν έχει καθοριστεί"}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${
                            localProfile.subscriptionStatus === "active"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : localProfile.subscriptionStatus === "trialing"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          }`}
                        >
                          {localProfile.subscriptionStatus || "none"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {localProfile.subscriptionStatus === "trialing" &&
                          "Απολαμβάνετε δωρεάν πρόσβαση σε όλα τα AI modules για 14 ημέρες. Αναβαθμίστε ανά πάσα στιγμή."}
                        {localProfile.subscriptionStatus === "active" &&
                          "Έχετε απεριόριστη πρόσβαση σε όλα τα εργαλεία δημιουργίας σεναρίων και σχεδιασμού με κορυφαία προτεραιότητα."}
                        {(localProfile.subscriptionStatus === "none" ||
                          localProfile.subscriptionStatus === "canceled") &&
                          "Για να χρησιμοποιήσετε τα εργαλεία AI και το Studio, θα πρέπει να ενεργοποιήσετε μια συνδρομή."}
                      </p>
                    </div>

                    {localProfile.subscriptionExpiresAt && (
                      <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                            Λήξη / Ανανέωση
                          </p>
                          <p className="text-xs font-bold text-slate-300 mt-0.5">
                            {new Date(
                              localProfile.subscriptionExpiresAt,
                            ).toLocaleDateString("el-GR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {localProfile.subscriptionStatus === "active" && (
                    <div className="mt-6 pt-6 border-t border-slate-900/60 flex justify-end">
                      <button
                        type="button"
                        disabled={loadingPlan === "cancel"}
                        onClick={handleCancelSubscription}
                        className="py-3 px-6 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {loadingPlan === "cancel" ? (
                          <React.Fragment>
                            <div className="w-3 h-3 border-2 border-rose-400/33 border-t-rose-400 rounded-full animate-spin" />
                            <span>Ακύρωση...</span>
                          </React.Fragment>
                        ) : (
                          "Ακύρωση Συνδρομής"
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Billing Cycle Toggle */}
                <div className="col-span-full flex items-center justify-center p-1 bg-slate-900/60 border border-slate-800/80 rounded-[2rem] w-fit mx-auto relative z-10 my-4">
                  <button
                    type="button"
                    onClick={() => setBillingInterval("monthly")}
                    className={`py-2.5 px-6 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all ${
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
                    className={`py-2.5 px-6 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      billingInterval === "yearly"
                        ? "bg-indigo-600 text-slate-50 shadow-lg shadow-indigo-600/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>Ετήσια Χρέωση</span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-extrabold normal-case leading-none">
                      Save 20%
                    </span>
                  </button>
                </div>

                {/* Simulated payment plan card - Starter */}
                <div
                  className="p-6 rounded-[2rem] border bg-slate-950/30 flex flex-col justify-between border-slate-900/60"
                >
                  <div>
                    <span className="text-[9px] font-bold tracking-widest px-3 py-1 rounded-full border bg-slate-900/80 from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30">
                      ΒΑΣΙΚΟ
                    </span>
                    <h3 className="text-lg font-bold text-slate-50 mt-4 font-serif">
                      Starter Plan
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 h-12">
                      Ιδανικό για νέους wedding filmmakers με έως 5 ενεργά projects.
                    </p>
                    <div className="flex items-baseline gap-1 my-6">
                      <span className="text-3xl font-extrabold text-slate-50">
                        {billingInterval === "monthly" ? "€19" : "€15"}
                      </span>
                      <span className="text-slate-500 text-xs font-semibold">
                        / μήνα
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-505 text-slate-500 font-semibold mb-4 leading-none">
                      {billingInterval === "monthly" ? "Χρέωση ανά μήνα" : "Χρέωση €180/έτος (-21%)"}
                    </p>
                  </div>
                  <button
                    disabled={
                      localProfile.subscriptionStatus === "active" ||
                      loadingPlan === "starter"
                    }
                    onClick={() => handleStripeCheckout(billingInterval === "monthly" ? "starter_monthly" : "starter_yearly")}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      localProfile.subscriptionStatus === "active"
                        ? "bg-slate-900 text-slate-500 border border-slate-850 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95"
                    }`}
                  >
                    {loadingPlan === "starter" ? (
                      <React.Fragment>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Μεταφορά...</span>
                      </React.Fragment>
                    ) : localProfile.subscriptionStatus === "active" ? (
                      "Ενεργή Συνδρομή"
                    ) : hasStripeKey ? (
                      "Αναβαθμιση με Stripe"
                    ) : (
                      "Αναβαθμιση (Sandbox)"
                    )}
                  </button>
                </div>

                {/* Simulated payment plan card - Pro */}
                <div
                  className={`p-6 rounded-[2rem] border bg-slate-950/30 flex flex-col justify-between ${
                    localProfile.subscriptionStatus === "active"
                      ? "border-slate-900/60"
                      : "border-indigo-505 shadow-lg shadow-indigo-500/5"
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-bold tracking-widest px-3 py-1 rounded-full border bg-slate-900/80 from-indigo-600/30 to-purple-600/20 text-indigo-300 border-indigo-500/30">
                      ΔΗΜΟΦΙΛΕΣ
                    </span>
                    <h3 className="text-lg font-bold text-slate-50 mt-4 font-serif">
                      Pro Studio
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 h-12">
                      Πλήρης πρόσβαση σε όλα τα AI modules με μέγιστη ταχύτητα
                      παραγωγής.
                    </p>
                    <div className="flex items-baseline gap-1 my-6">
                      <span className="text-3xl font-extrabold text-slate-50">
                        {billingInterval === "monthly" ? "€49" : "€39"}
                      </span>
                      <span className="text-slate-500 text-xs font-semibold">
                        / μήνα
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-525 text-slate-500 font-semibold mb-4 leading-none">
                      {billingInterval === "monthly" ? "Χρέωση ανά μήνα" : "Χρέωση €468/έτος (-20%)"}
                    </p>
                  </div>
                  <button
                    disabled={
                      localProfile.subscriptionStatus === "active" ||
                      loadingPlan === "pro"
                    }
                    onClick={() => handleStripeCheckout(billingInterval === "monthly" ? "pro_monthly" : "pro_yearly")}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      localProfile.subscriptionStatus === "active"
                        ? "bg-slate-900 text-slate-500 border border-slate-850 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95"
                    }`}
                  >
                    {loadingPlan === "pro" ? (
                      <React.Fragment>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Μεταφορά...</span>
                      </React.Fragment>
                    ) : localProfile.subscriptionStatus === "active" ? (
                      "Ενεργή Συνδρομή"
                    ) : hasStripeKey ? (
                      "Αναβαθμιση με Stripe"
                    ) : (
                      "Αναβαθμιση (Sandbox)"
                    )}
                  </button>
                </div>

                {/* Simulated payment plan card - Lifetime */}
                <div className="p-6 rounded-[2rem] border border-slate-900 bg-slate-955/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest px-3 py-1 rounded-full border bg-slate-900/80 from-pink-500/20 to-purple-500/10 text-pink-400 border-pink-500/30">
                      ΚΑΛΥΤΕΡΗ ΑΞΙΑ
                    </span>
                    <h3 className="text-lg font-bold text-slate-50 mt-4 font-serif">
                      Lifetime Access
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 h-12">
                      Μία πληρωμή για πάντα. Ιδανικό για βεντεογράφους με
                      σταθερά έργα.
                    </p>
                    <div className="flex items-baseline gap-1 my-6">
                      <span className="text-3xl font-extrabold text-slate-50">
                        €299
                      </span>
                      <span className="text-slate-500 text-xs font-semibold">
                        / εφάπαξ
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-4 leading-none">
                      Μία πληρωμή για πάντα
                    </p>
                  </div>
                  <button
                    disabled={
                      (localProfile.subscriptionStatus === "active" &&
                        !localProfile.subscriptionExpiresAt) ||
                      loadingPlan === "lifetime"
                    }
                    onClick={() => handleStripeCheckout("lifetime")}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-[10px] uppercase tracking-wider border border-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {loadingPlan === "lifetime" ? (
                      <React.Fragment>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Μεταφορά...</span>
                      </React.Fragment>
                    ) : hasStripeKey ? (
                      "Αγορα με Stripe"
                    ) : (
                      "Αγορα (Sandbox)"
                    )}
                  </button>
                </div>

                {/* Simulated free-tier trial cancel simulation to test paywall */}
                <div className="p-6 rounded-[2rem] border border-dashed border-rose-500/20 bg-rose-500/5 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest px-3 py-1 rounded-full border bg-slate-900/80 text-rose-450 border-rose-500/20">
                      ΔΟΚΙΜΗ PAYWALL
                    </span>
                    <h3 className="text-lg font-bold text-slate-50 mt-4 font-serif">
                      Απενεργοποίηση Πλάνου
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 h-12">
                      Θέστε τη συνδρομή σε "none" για να δοκιμάσετε την οθόνη του Paywall.
                    </p>
                    <div className="flex items-baseline gap-1 my-6">
                      <span className="text-3xl font-extrabold text-slate-50">
                        €0
                      </span>
                      <span className="text-slate-500 text-xs font-semibold">
                        / test
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-4 leading-none">
                      Προσομοίωση λήξης συνδρομής
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...localProfile,
                        subscriptionStatus: "none" as const,
                        subscriptionExpiresAt: "",
                      };
                      setLocalProfile(updated);
                      onUpdateProfile(updated);
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-600 text-rose-400 font-bold text-[10px] uppercase tracking-wider border border-rose-500/20 transition-all text-center"
                  >
                    Ενεργοποιηση Paywall
                  </button>
                </div>
              </div>

              {/* Billing History Section */}
              <div className="mt-12 bg-slate-950/40 border border-slate-800/80 p-8 rounded-[2rem]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-50 text-lg">
                      Ιστορικό Πληρωμών
                    </h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                      Δείτε και κατεβάστε τις αποδείξεις σας
                    </p>
                  </div>
                </div>

                {loadingInvoices ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : invoices.length > 0 ? (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800/50"
                      >
                        <div>
                          <p className="text-slate-200 font-bold text-sm">
                            {invoice.number || "Απόδειξη"}
                          </p>
                          <p className="text-slate-500 text-xs mt-1 font-mono">
                            {new Date(
                              invoice.created * 1000,
                            ).toLocaleDateString("el-GR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-slate-50 font-bold">
                              €{(invoice.amount_paid / 100).toFixed(2)}
                            </p>
                            <p
                              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${invoice.status === "paid" ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              {invoice.status === "paid"
                                ? "Πληρωθηκε"
                                : invoice.status}
                            </p>
                          </div>
                          {invoice.pdf_url && (
                            <a
                              href={invoice.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 flex items-center justify-center transition-all shadow-lg active:scale-95"
                              title="Κατέβασμα Απόδειξης (PDF)"
                            >
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <Receipt size={32} className="text-slate-600 mb-4" />
                    <p className="text-slate-500 font-medium">
                      Δεν βρέθηκαν προηγούμενες αποδείξεις.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
          <Shield size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-rose-400 uppercase tracking-[0.2em] text-sm">
            Data Security & Privacy
          </h4>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            AI Studio requests are powered by Google Gemini. All project data is
            stored locally in your browser (Local Storage) for this version. In
            a production environment, Row Level Security (RLS) ensures that only
            you can access your data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
