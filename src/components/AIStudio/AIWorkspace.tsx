import * as React from "react";
import { Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Project, AIModuleType, UserProfile } from "../../../types";
import { AI_MODULES } from "../../../constants";
import { ProjectSelector } from "./ProjectSelector";

interface AIWorkspaceProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  selectedModuleId: AIModuleType;
  inputs: Record<string, string>;
  setInputs: (inputs: Record<string, string>) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
  userProfile: UserProfile;
  hasGeminiKey: boolean;
}

export const AIWorkspace: React.FC<AIWorkspaceProps> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  selectedModuleId,
  inputs,
  setInputs,
  isGenerating,
  handleGenerate,
  userProfile,
  hasGeminiKey,
}) => {
  const selectedModule = AI_MODULES.find((m) => m.id === selectedModuleId);

  if (!selectedModule) return null;

  return (
    <div className="bg-slate-900/40 border border-slate-800/50 p-8 md:p-10 rounded-[3rem] space-y-10 shadow-2xl shadow-indigo-600/5">
      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        userProfile={userProfile}
        hasGeminiKey={hasGeminiKey}
      />

      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center text-5xl border border-indigo-500/20 shrink-0 shadow-xl shadow-indigo-600/5">
            {selectedModule.icon}
          </div>
          <div>
            <h3 className="text-3xl font-bold font-serif text-slate-50">
              {selectedModule.title}
            </h3>
            <p className="text-slate-500 font-medium mt-1 leading-relaxed">
              {selectedModule.description}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {selectedModule.inputs.map((input) => (
            <div key={input.key} className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">
                {input.label}
              </label>
              {input.type === "textarea" ? (
                <textarea
                  value={inputs[input.key] || ""}
                  onChange={(e) =>
                    setInputs({ ...inputs, [input.key]: e.target.value })
                  }
                  className="w-full bg-slate-950/50 p-6 rounded-[2rem] min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-300 border border-slate-800 transition-all placeholder:text-slate-700"
                  placeholder="Provide specific details to guide the AI..."
                />
              ) : input.type === "select" ? (
                <div className="relative group">
                  <select
                    value={inputs[input.key] || ""}
                    onChange={(e) =>
                      setInputs({ ...inputs, [input.key]: e.target.value })
                    }
                    className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 appearance-none border border-slate-800 group-hover:border-slate-700 transition-all"
                  >
                    <option value="">Select option...</option>
                    {input.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 pointer-events-none">
                    <ChevronDown size={20} />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={inputs[input.key] || ""}
                  onChange={(e) =>
                    setInputs({ ...inputs, [input.key]: e.target.value })
                  }
                  className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 border border-slate-800 transition-all placeholder:text-slate-700"
                  placeholder="Type here..."
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedProjectId}
          className="w-full py-6 rounded-[2rem] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold flex items-center justify-center gap-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-indigo-600/30 text-xl active:scale-95"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>Generating Magic...</span>
            </>
          ) : (
            <>
              <Sparkles size={24} />
              <span>Generate Content</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
