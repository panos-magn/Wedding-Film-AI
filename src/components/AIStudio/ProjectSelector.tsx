import * as React from "react";
import { Project } from "../../../types";
import { ChevronDown, Check, AlertTriangle, Sparkles } from "lucide-react";
import { UserProfile } from "../../../types";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  userProfile: UserProfile;
  hasGeminiKey: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  userProfile,
  hasGeminiKey,
}) => {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
        Project Context
      </label>
      <div className="relative group">
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full bg-slate-950/50 p-6 rounded-[2rem] appearance-none outline-none focus:ring-2 focus:ring-indigo-500/30 pr-14 font-bold text-xl text-slate-50 border border-slate-800 group-hover:border-slate-700 transition-all"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.coupleNames}{" "}
              {p.weddingDate && !isNaN(new Date(p.weddingDate).getTime())
                ? `(${new Date(p.weddingDate).getFullYear()})`
                : ""}
            </option>
          ))}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 pointer-events-none">
          <ChevronDown size={20} />
        </div>
      </div>

      {userProfile.role === "admin" ? (
        hasGeminiKey ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            <Check size={16} /> Λειτουργία: Admin (Σύνδεση με Gemini AI)
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            <AlertTriangle size={16} /> Attention: Gemini API Key is missing.
            Please configure it in your Settings.
          </div>
        )
      ) : (
        <div className="flex flex-col gap-2 p-5 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 text-slate-300">
          <div className="flex items-center gap-3 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles
              size={16}
              className="text-indigo-400 animate-pulse shrink-0"
            />
            <span>Λειτουργία: Local Cinematic Engine (Δωρεάν)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
            Χρησιμοποιείτε την ενσωματωμένη μηχανή παραγωγής. Για να
            ενεργοποιήσετε την απεριόριστη, προσαρμοσμένη παραγωγή Gemini AI,
            μπορείτε προαιρετικά να εισάγετε το δικό σας δωρεάν Gemini API Key
            στις <strong className="text-indigo-300">API Configuration</strong>{" "}
            ρυθμίσεις του προφίλ σας.
          </p>
        </div>
      )}
    </div>
  );
};
