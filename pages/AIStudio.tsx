import * as React from "react";
import { useState, useEffect } from "react";
import { Project, AIModuleType, AIResult, UserProfile } from "../types";
import { History } from "lucide-react";
import { AI_MODULES } from "../constants";
import { auth } from "../services/firebase";
import { generateAIContent } from "../services/geminiService";
import { SidebarSelector } from "../src/components/AIStudio/SidebarSelector";
import { MobileModuleSelector } from "../src/components/AIStudio/MobileModuleSelector";
import { AIWorkspace } from "../src/components/AIStudio/AIWorkspace";
import { ResultDisplay } from "../src/components/AIStudio/ResultDisplay";
import { HistorySidebar } from "../src/components/AIStudio/HistorySidebar";

interface AIStudioProps {
  projects: Project[];
  userProfile: UserProfile;
  initialProjectId?: string | null;
  initialModuleId?: AIModuleType | null;
  onShowToast: (msg: string, type?: "success" | "error") => void;
  savedResults: AIResult[];
  onSaveResult: (result: AIResult) => Promise<void>;
  onDeleteResult: (id: string) => Promise<void>;
  onUpdateProfile: (updated: UserProfile) => void;
}

const AIStudio: React.FC<AIStudioProps> = ({
  projects,
  userProfile,
  initialProjectId,
  initialModuleId,
  onShowToast,
  savedResults,
  onSaveResult,
  onDeleteResult,
  onUpdateProfile,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || projects[0]?.id || "",
  );
  const [selectedModuleId, setSelectedModuleId] = useState<AIModuleType>(
    initialModuleId || "shot-planning",
  );
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedModule = AI_MODULES.find((m) => m.id === selectedModuleId);

  useEffect(() => {
    if (initialProjectId) setSelectedProjectId(initialProjectId);
    if (initialModuleId) setSelectedModuleId(initialModuleId);
  }, [initialProjectId, initialModuleId]);

  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasGeminiKey === "boolean") {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch((err) => console.error("Error checking key status:", err));
  }, []);

  const handleGenerate = async () => {
    if (!selectedProject || !selectedModule) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const output = await generateAIContent(
        selectedModule,
        selectedProject,
        inputs,
        auth.currentUser?.uid || "",
        userProfile?.customGeminiApiKey,
        userProfile?.customOpenAiApiKey,
        userProfile?.aiProvider,
      );
      setResult(output.text);
      if (typeof output.aiCreditsUsed === "number") {
        onUpdateProfile({
          ...userProfile,
          aiCreditsUsed: output.aiCreditsUsed,
        });
      }
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    } catch (err: any) {
      onShowToast(
        `Σφάλμα: ${err.message || "Αποτυχία παραγωγής περιεχομένου."}`,
        "error",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result || !selectedProject || !selectedModule) return;
    const newResult: AIResult = {
      id: "",
      projectId: selectedProjectId,
      moduleType: selectedModuleId,
      title: `${selectedModule.title} για ${selectedProject.coupleNames}`,
      content: result,
      createdAt: new Date().toISOString(),
    };
    try {
      await onSaveResult(newResult);
      onShowToast("Αποθηκεύτηκε στα Αποτελέσματα του Έργου!");
    } catch (err) {
      onShowToast("Αποτυχία αποθήκευσης αποτελέσματος.", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 lg:pb-0 w-full min-w-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold font-serif text-slate-50 tracking-tight">
            AI Studio
          </h2>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">
            Transform your workflow with AI
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl text-slate-400 hover:text-slate-50 transition-all font-bold text-xs uppercase tracking-widest"
        >
          <History size={18} />
          <span>{showHistory ? "Hide History" : "View History"}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Mobile Module Selector */}
        <MobileModuleSelector
          selectedModuleId={selectedModuleId}
          setSelectedModuleId={setSelectedModuleId}
          onReset={() => {
            setResult(null);
            setInputs({});
          }}
        />

        {/* Sidebar Selector (Desktop Only) */}
        <SidebarSelector
          selectedModuleId={selectedModuleId}
          setSelectedModuleId={setSelectedModuleId}
          onReset={() => {
            setResult(null);
            setInputs({});
          }}
        />

        {/* Workspace */}
        <div className="lg:col-span-6 space-y-8">
          <AIWorkspace
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            selectedModuleId={selectedModuleId}
            inputs={inputs}
            setInputs={setInputs}
            isGenerating={isGenerating}
            handleGenerate={handleGenerate}
            userProfile={userProfile}
            hasGeminiKey={hasGeminiKey}
          />

          {result && selectedProject && selectedModule && (
            <ResultDisplay
              result={result}
              selectedProjectId={selectedProjectId}
              selectedModuleId={selectedModuleId}
              selectedProject={selectedProject}
              userProfile={userProfile}
              handleSave={handleSave}
            />
          )}
        </div>

        {/* History / Saved */}
        <HistorySidebar
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          savedResults={savedResults}
          selectedProjectId={selectedProjectId}
          onDeleteResult={onDeleteResult}
          onSelectResult={setResult}
        />
      </div>
    </div>
  );
};

export default AIStudio;
