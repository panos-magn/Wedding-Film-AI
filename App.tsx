import * as React from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Settings as SettingsIcon,
  Plus,
  LogOut,
  Calendar,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  CheckCircle,
  User as UserIcon,
  Shield,
} from "lucide-react";
import { Project, AIModuleType, UserProfile, AIResult } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import ProjectList from "./pages/ProjectList";
import ProjectDetail from "./pages/ProjectDetail";
import AIStudio from "./pages/AIStudio";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import SubscriptionGate from "./pages/SubscriptionGate";
import AdminDashboard from "./pages/AdminDashboard";
import { logoutUser } from "./services/firebase";
import { useUserData } from "./src/hooks/useUserData";

const SidebarItem = ({
  icon: Icon,
  label,
  tab,
  activeTab,
  setActiveTab,
  setSelectedProjectId,
  setSelectedModuleId,
  setIsSidebarOpen,
}: any) => (
  <button
    onClick={() => {
      setActiveTab(tab);
      setSelectedProjectId(null);
      setSelectedModuleId(null);
      setIsSidebarOpen(false);
    }}
    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 ${
      activeTab === tab
        ? "sidebar-active text-indigo-400 bg-indigo-500/10"
        : "text-slate-400 hover:text-slate-50 hover:bg-slate-800/50"
    }`}
  >
    <Icon size={22} />
    <span className="font-semibold">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<
    "dashboard" | "projects" | "ai-studio" | "settings" | "admin"
  >("dashboard");
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | null
  >(null);
  const [selectedModuleId, setSelectedModuleId] =
    React.useState<AIModuleType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [globalLoading, setGlobalLoading] = React.useState<boolean>(false);

  const showToast = React.useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const userData = useUserData(showToast, setGlobalLoading);
  const {
    firebaseUser,
    authChecking,
    projects,
    aiResults,
    userProfile,
    setUserProfile,
    handleUpdateProfile,
    handleAddProject,
    handleUpdateProject,
    handleDeleteProject,
    handleSaveAIResult,
    handleDeleteAIResult,
  } = userData;

  const verifiedRef = React.useRef<string | null>(null);

  // Stripe checkout session redirection and verification
  React.useEffect(() => {
    if (!firebaseUser || !firebaseUser.uid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    if (sessionId && verifiedRef.current !== sessionId) {
      verifiedRef.current = sessionId;

      // Clear session_id from URL bar
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      setGlobalLoading(true);
      firebaseUser.getIdToken().then(token => {
        fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error("Verification network response failed");
            }
            return res.json();
          })
          .then(async (data) => {
            if (data && data.success && data.userId === firebaseUser.uid) {
              const updated: UserProfile = {
                ...userProfile,
                subscriptionStatus: data.subscriptionStatus,
                subscriptionExpiresAt: data.subscriptionExpiresAt,
                stripeCustomerId: data.stripeCustomerId || "",
              };
              handleUpdateProfile(updated);
              showToast(
                `Συγχαρητήρια! Η συνδρομή σας ενεργοποιήθηκε επιτυχώς${data.isSimulated ? " (Simulated)" : ""}!`,
              );
            } else {
              showToast("Αποτυχία επιβεβαίωσης πληρωμής.", "error");
            }
          })
          .catch((err) => {
            console.error("Error verifying Stripe session:", err);
            showToast("Σφάλμα κατά την επιβεβαίωση της πληρωμής.", "error");
          })
          .finally(() => {
            setGlobalLoading(false);
          });
      });
    }
  }, [firebaseUser, userProfile, handleUpdateProfile, showToast]);

  const handleLogout = async () => {
    setGlobalLoading(true);
    try {
      await logoutUser();
      setSelectedProjectId(null);
      setSelectedModuleId(null);
      setActiveTab("dashboard");
      showToast("Αποσυνδεθήκατε επιτυχώς.");
    } catch (error) {
      showToast("Αποτυχία αποσύνδεσης.", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const navigateToProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveTab("projects");
  };

  const navigateToAIModule = (moduleId: AIModuleType, projectId?: string) => {
    setSelectedModuleId(moduleId);
    if (projectId) setSelectedProjectId(projectId);
    setActiveTab("ai-studio");
  };

  // 1. Sleek loading state
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950 opacity-60 z-0" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl relative shadow-2xl animate-spin" />
          <p className="text-sm font-semibold tracking-widest text-slate-400 mt-6 uppercase animate-pulse">
            Φόρτωση Studio...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!firebaseUser) {
    return (
      <React.Fragment>
        <Auth
          onSignInSuccess={() => {}}
          onLoading={(l) => setGlobalLoading(l)}
          onShowToast={(msg, type) => showToast(msg, type)}
        />
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "50%" }}
              animate={{ opacity: 1, y: 0, x: "50%" }}
              exit={{ opacity: 0, y: -20, x: "50%" }}
              className={`fixed top-6 right-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md flex items-center gap-3 min-w-[280px] justify-center ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
              style={{ transform: "translateX(50%)" }}
            >
              {toast.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="font-bold text-sm tracking-tight">
                {toast.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </React.Fragment>
    );
  }

  const isSubscriptionValid =
    userProfile.role === "admin" ||
    (["active", "trialing", "canceled"].includes(userProfile.subscriptionStatus || "") &&
     !!userProfile.subscriptionExpiresAt &&
     new Date(userProfile.subscriptionExpiresAt).getTime() > Date.now());

  // 3. Unauthorized / Subscription Gate state
  if (firebaseUser && !isSubscriptionValid) {
    return (
      <React.Fragment>
        <SubscriptionGate
          userEmail={firebaseUser.email || ""}
          onLogout={handleLogout}
        />
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "50%" }}
              animate={{ opacity: 1, y: 0, x: "50%" }}
              exit={{ opacity: 0, y: -20, x: "50%" }}
              className={`fixed top-6 right-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md flex items-center gap-3 min-w-[280px] justify-center ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
              style={{ transform: "translateX(50%)" }}
            >
              {toast.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="font-bold text-sm tracking-tight">
                {toast.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </React.Fragment>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden w-full">
      {/* Global Loading overlay */}
      {globalLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-indigo-400 mt-4 uppercase tracking-widest">
              Επεξεργασία...
            </p>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-slate-800/60 bg-slate-950/50 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
              W
            </div>
            <h1 className="text-xl font-bold font-serif gradient-text tracking-tight">
              WeddingFilmAI
            </h1>
          </div>

          <nav className="space-y-1.5">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              tab="dashboard"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSelectedProjectId={setSelectedProjectId}
              setSelectedModuleId={setSelectedModuleId}
              setIsSidebarOpen={setIsSidebarOpen}
            />
            <SidebarItem
              icon={FolderKanban}
              label="Projects"
              tab="projects"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSelectedProjectId={setSelectedProjectId}
              setSelectedModuleId={setSelectedModuleId}
              setIsSidebarOpen={setIsSidebarOpen}
            />
            <SidebarItem
              icon={Sparkles}
              label="AI Studio"
              tab="ai-studio"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSelectedProjectId={setSelectedProjectId}
              setSelectedModuleId={setSelectedModuleId}
              setIsSidebarOpen={setIsSidebarOpen}
            />
            <SidebarItem
              icon={SettingsIcon}
              label="Settings"
              tab="settings"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSelectedProjectId={setSelectedProjectId}
              setSelectedModuleId={setSelectedModuleId}
              setIsSidebarOpen={setIsSidebarOpen}
            />
            {userProfile.role === "admin" && (
              <SidebarItem
                icon={Shield}
                label="Admin Portal"
                tab="admin"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setSelectedProjectId={setSelectedProjectId}
                setSelectedModuleId={setSelectedModuleId}
                setIsSidebarOpen={setIsSidebarOpen}
              />
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800/50 space-y-4">
          {/* AI Credits Usage Dashboard */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="uppercase tracking-widest text-indigo-400 text-[10px]">AI CREDITS</span>
              <span>
                {userProfile.role === "admin" 
                  ? "Άπειρα" 
                  : `${userProfile.aiCreditsUsed || 0} / ${
                      userProfile.subscriptionStatus === "active"
                        ? userProfile.subscriptionPlan === "starter_monthly" || userProfile.subscriptionPlan === "starter_yearly"
                          ? 30
                          : userProfile.subscriptionPlan === "lifetime"
                            ? 500
                            : 150
                        : 3
                    }`}
              </span>
            </div>
            {userProfile.role !== "admin" && (
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (((userProfile.aiCreditsUsed || 0) / (
                        userProfile.subscriptionStatus === "active"
                          ? userProfile.subscriptionPlan === "starter_monthly" || userProfile.subscriptionPlan === "starter_yearly"
                            ? 30
                            : userProfile.subscriptionPlan === "lifetime"
                              ? 500
                              : 150
                          : 3
                      )) * 100)
                    )}%`
                  }}
                />
              </div>
            )}
            <p className="text-[9px] text-slate-500 leading-normal">
              {userProfile.role === "admin"
                ? "Λογαριασμός Διαχειριστή"
                : userProfile.subscriptionStatus === "active"
                  ? "Μηνιαία credits ανανέωσης πλάνου"
                  : "Δωρεάν Δοκιμή (3 credits συνολικά)"}
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
              {userProfile.fullName ? userProfile.fullName.charAt(0) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-50 truncate">
                {userProfile.fullName || "User"}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">
                {userProfile.businessName || "My Studio"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-400 transition-colors p-1.5"
              title="Αποσύνδεση"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              W
            </div>
            <span className="font-serif font-bold text-lg gradient-text">
              WeddingFilmAI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
              {userProfile.fullName ? userProfile.fullName.charAt(0) : "?"}
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
              title="Αποσύνδεση"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "50%" }}
              animate={{ opacity: 1, y: 0, x: "50%" }}
              exit={{ opacity: 0, y: -20, x: "50%" }}
              className={`fixed top-6 right-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md flex items-center gap-3 min-w-[280px] justify-center ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
              style={{ transform: "translateX(50%)" }}
            >
              {toast.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="font-bold text-sm tracking-tight">
                {toast.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 lg:p-10 flex-1 max-w-7xl mx-auto w-full min-w-0">
          {activeTab === "dashboard" && (
            <Dashboard
              projects={projects}
              onNavigateProject={navigateToProject}
              onNavigateAI={navigateToAIModule}
            />
          )}
          {activeTab === "projects" && !selectedProjectId && (
            <ProjectList
              projects={projects}
              onSelectProject={setSelectedProjectId}
              onAddProject={handleAddProject}
            />
          )}
          {activeTab === "projects" && selectedProjectId && (
            <ProjectDetail
              project={projects.find((p) => p.id === selectedProjectId)!}
              userProfile={userProfile}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={(id) =>
                handleDeleteProject(id, () => setSelectedProjectId(null))
              }
              onBack={() => setSelectedProjectId(null)}
              onNavigateAI={(mid) => navigateToAIModule(mid, selectedProjectId)}
            />
          )}
          {activeTab === "ai-studio" && (
            <AIStudio
              projects={projects}
              userProfile={userProfile}
              initialProjectId={selectedProjectId}
              initialModuleId={selectedModuleId}
              onShowToast={showToast}
              savedResults={aiResults}
              onSaveResult={handleSaveAIResult}
              onDeleteResult={handleDeleteAIResult}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
          {activeTab === "settings" && (
            <Settings
              profile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onLocalProfileUpdate={setUserProfile}
            />
          )}
          {activeTab === "admin" && userProfile.role === "admin" && (
            <AdminDashboard
              onBackToApp={() => setActiveTab("dashboard")}
              showToast={showToast}
              currentUserId={firebaseUser.uid}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/50 px-6 py-3 pb-8 z-50 flex items-center justify-between">
          <NavButton
            icon={LayoutDashboard}
            label="Home"
            active={activeTab === "dashboard"}
            onClick={() => {
              setActiveTab("dashboard");
              setSelectedProjectId(null);
            }}
          />
          <NavButton
            icon={FolderKanban}
            label="Projects"
            active={activeTab === "projects"}
            onClick={() => {
              setActiveTab("projects");
              setSelectedProjectId(null);
            }}
          />
          <div className="relative -top-6">
            <button
              onClick={() => {
                setActiveTab("ai-studio");
                setSelectedModuleId(null);
              }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${
                activeTab === "ai-studio"
                  ? "bg-indigo-600 text-white scale-110 shadow-indigo-600/40"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <Sparkles
                size={24}
                fill={activeTab === "ai-studio" ? "currentColor" : "none"}
              />
            </button>
          </div>
          <NavButton
            icon={UserIcon}
            label="Profile"
            active={activeTab === "settings"}
            onClick={() => {
              setActiveTab("settings");
              setSelectedProjectId(null);
            }}
          />
          {userProfile.role === "admin" && (
            <NavButton
              icon={Shield}
              label="Admin"
              active={activeTab === "admin"}
              onClick={() => {
                setActiveTab("admin");
                setSelectedProjectId(null);
              }}
            />
          )}
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center gap-1 transition-colors hidden ${activeTab === "settings" ? "text-indigo-400" : "text-slate-500"}`}
          >
            <SettingsIcon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Settings
            </span>
          </button>
        </nav>
      </main>
    </div>
  );
};

const NavButton = ({
  icon: Icon,
  label,
  active,
  onClick,
  className = "",
}: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? "text-indigo-400 scale-110" : "text-slate-500"} ${className}`}
  >
    <Icon size={20} />
    <span className="text-[10px] font-bold uppercase tracking-widest">
      {label}
    </span>
  </button>
);

export default App;
