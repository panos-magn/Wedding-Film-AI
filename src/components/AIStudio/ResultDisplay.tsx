import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, FileDown, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { exportAIResultToPDF } from "../../../services/PDFService";
import { Project, UserProfile, AIModuleType } from "../../../types";
import { AI_MODULES } from "../../../constants";

interface ResultDisplayProps {
  result: string;
  selectedProjectId: string;
  selectedModuleId: AIModuleType;
  selectedProject: Project;
  userProfile: UserProfile;
  handleSave: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  selectedProjectId,
  selectedModuleId,
  selectedProject,
  userProfile,
  handleSave,
}) => {
  const selectedModule = AI_MODULES.find((m) => m.id === selectedModuleId);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="result"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 border border-slate-800/50 p-8 md:p-10 rounded-[3rem] space-y-8 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800/50 pb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Check size={24} />
            </div>
            <h4 className="text-2xl font-bold text-slate-50 font-serif">
              AI Result
            </h4>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() =>
                exportAIResultToPDF(
                  {
                    id: "temp",
                    projectId: selectedProjectId,
                    moduleType: selectedModuleId,
                    title: `${selectedModule?.title} για ${selectedProject?.coupleNames}`,
                    content: result,
                    createdAt: new Date().toISOString(),
                  },
                  userProfile,
                )
              }
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-2xl hover:bg-sky-500 hover:text-slate-50 transition-all font-bold text-sm"
            >
              <FileDown size={20} />
              <span>PDF</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all font-bold text-sm"
            >
              <Save size={20} />
              <span>Save</span>
            </button>
          </div>
        </div>
        <div className="markdown-body max-w-none text-slate-300 leading-relaxed text-lg bg-slate-950/30 p-8 rounded-[2rem] border border-slate-800/50">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
