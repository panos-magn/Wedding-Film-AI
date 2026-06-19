import * as React from "react";
import { AIResult } from "../../../types";
import { History, Trash2, ExternalLink } from "lucide-react";

interface HistorySidebarProps {
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  savedResults: AIResult[];
  selectedProjectId: string;
  onDeleteResult: (id: string) => void;
  onSelectResult: (content: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  showHistory,
  setShowHistory,
  savedResults,
  selectedProjectId,
  onDeleteResult,
  onSelectResult,
}) => {
  return (
    <div
      className={`lg:col-span-3 space-y-6 ${!showHistory && "hidden lg:block"}`}
    >
      <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] space-y-8">
        <h3 className="text-xl font-bold font-serif flex items-center gap-3 text-slate-50">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
            <History size={20} />
          </div>
          Recent Results
        </h3>
        <div className="space-y-4">
          {savedResults.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                <History size={32} />
              </div>
              <p className="text-sm text-slate-500 font-medium italic">
                No saved results yet.
              </p>
            </div>
          ) : (
            savedResults
              .filter((r) => r.projectId === selectedProjectId)
              .map((result) => (
                <div
                  key={result.id}
                  className="group bg-slate-950/50 p-5 rounded-[1.5rem] border border-slate-800 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1 truncate">
                        {result.moduleType.replace("-", " ")}
                      </p>
                      <p className="text-xs font-bold text-slate-50">
                        {new Date(result.createdAt).toLocaleDateString(
                          "el-GR",
                          { day: "numeric", month: "short" },
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteResult(result.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      onSelectResult(result.content);
                      if (window.innerWidth < 1024) setShowHistory(false);
                    }}
                    className="w-full py-3 bg-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <ExternalLink size={12} /> View Result
                  </button>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
