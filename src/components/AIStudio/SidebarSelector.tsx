import * as React from "react";
import { AIModuleType } from "../../../types";
import { AI_MODULES } from "../../../constants";

interface SidebarSelectorProps {
  selectedModuleId: AIModuleType;
  setSelectedModuleId: (id: AIModuleType) => void;
  onReset: () => void;
}

export const SidebarSelector: React.FC<SidebarSelectorProps> = ({
  selectedModuleId,
  setSelectedModuleId,
  onReset,
}) => {
  return (
    <div className="hidden lg:block lg:col-span-3 space-y-6">
      <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-[2.5rem] space-y-6">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2">
          Select AI Tool
        </h3>
        <div className="space-y-2">
          {AI_MODULES.map((module) => (
            <button
              key={module.id}
              onClick={() => {
                setSelectedModuleId(module.id);
                onReset();
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border ${
                selectedModuleId === module.id
                  ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-600 shadow-lg shadow-indigo-600/5"
                  : "text-slate-600 border-transparent hover:text-slate-950 hover:bg-slate-800/50"
              }`}
            >
              <span className="text-2xl shrink-0">{module.icon}</span>
              <span className="text-sm font-bold truncate">{module.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
