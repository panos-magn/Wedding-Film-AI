import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AIModuleType } from "../../../types";
import { AI_MODULES } from "../../../constants";

interface MobileModuleSelectorProps {
  selectedModuleId: AIModuleType;
  setSelectedModuleId: (id: AIModuleType) => void;
  onReset: () => void;
}

export const MobileModuleSelector: React.FC<MobileModuleSelectorProps> = ({
  selectedModuleId,
  setSelectedModuleId,
  onReset,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedModule = AI_MODULES.find((m) => m.id === selectedModuleId);

  if (!selectedModule) return null;

  return (
    <div className="lg:hidden text-slate-50">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] flex items-center justify-between border border-indigo-500/20 active:scale-[0.98] transition-transform shadow-2xl shadow-indigo-600/5 text-slate-50 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-3xl border border-indigo-500/20 shrink-0">
            {selectedModule.icon}
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
              Active Tool
            </p>
            <p className="text-xl font-bold flex-1">{selectedModule.title}</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
          <Menu size={20} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 h-[80vh] bg-slate-950 border-t border-slate-800 z-[60] p-8 flex flex-col lg:hidden rounded-t-[3rem] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-8 shrink-0"></div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-serif text-slate-50">
                  AI Studio Tools
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                {AI_MODULES.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => {
                      setSelectedModuleId(module.id);
                      setIsOpen(false);
                      onReset();
                    }}
                    className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all text-left border ${
                      selectedModuleId === module.id
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                        : "bg-slate-900/50 border-slate-800/50 text-slate-600 hover:bg-slate-900 hover:text-slate-950"
                    }`}
                  >
                    <span className="text-3xl shrink-0">{module.icon}</span>
                    <div>
                      <p className="font-bold text-lg leading-tight text-slate-50">
                        {module.title}
                      </p>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${selectedModuleId === module.id ? "text-indigo-100" : "text-slate-500"}`}
                      >
                        {module.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
