import * as React from "react";
import { Project, AIModuleType } from "../types";
import {
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { AI_MODULES, STATUS_COLORS, STATUS_LABELS } from "../constants";

interface DashboardProps {
  projects: Project[];
  onNavigateProject: (id: string) => void;
  onNavigateAI: (moduleId: AIModuleType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onNavigateProject,
  onNavigateAI,
}) => {
  const hasApiKey = !!process.env.API_KEY;
  const upcoming = [...projects]
    .sort((a, b) => {
      const dateA =
        a.weddingDate && !isNaN(new Date(a.weddingDate).getTime())
          ? new Date(a.weddingDate).getTime()
          : Infinity;
      const dateB =
        b.weddingDate && !isNaN(new Date(b.weddingDate).getTime())
          ? new Date(b.weddingDate).getTime()
          : Infinity;
      return dateA - dateB;
    })
    .slice(0, 3);

  const getUrgencyColor = (dateStr: string) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime()))
      return "text-slate-400 border-slate-500/30 bg-slate-500/10";
    const diff =
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 7) return "text-rose-400 border-rose-500/30 bg-rose-500/10";
    if (diff < 30) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-sky-400 border-sky-500/30 bg-sky-500/10";
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 w-full min-w-0">
      {/* Welcome Header Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold font-serif mb-3 text-slate-50 leading-tight">
            Καλώς ήρθατε!
          </h2>
          <p className="text-indigo-100/80 text-lg max-w-md">
            Η δημιουργικότητά σας δεν έχει όρια. Δείτε την πρόοδο των έργων σας.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-slate-50 uppercase tracking-widest">
              {projects.length} Ενεργά Έργα
            </div>
            <div className="px-4 py-2 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 text-xs font-bold text-emerald-300 uppercase tracking-widest">
              {projects.filter((p) => p.status === "booked").length} Νέες
              Κρατήσεις
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
        <Sparkles
          className="absolute right-10 bottom-10 text-slate-50/20"
          size={120}
        />
      </div>

      {!hasApiKey && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-center gap-4">
          <AlertTriangle className="text-amber-400 shrink-0" size={28} />
          <div>
            <h4 className="font-bold text-amber-400 uppercase tracking-widest text-[10px]">
              API Key Required
            </h4>
            <p className="text-xs text-slate-400">
              Configure your Gemini API key in settings to unlock AI features.
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats - Mobile Optimized Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Active"
          value={projects.length.toString()}
          color="text-indigo-400"
          bg="bg-indigo-500/5"
        />
        <StatCard
          icon={Users}
          label="Booked"
          value={projects
            .filter((p) => p.status === "booked")
            .length.toString()}
          color="text-sky-400"
          bg="bg-sky-500/5"
        />
        <StatCard
          icon={FileText}
          label="Editing"
          value={projects
            .filter((p) => p.status === "editing")
            .length.toString()}
          color="text-amber-400"
          bg="bg-amber-500/5"
        />
        <StatCard
          icon={CheckCircle2}
          label="Done"
          value={projects
            .filter((p) => p.status === "delivered")
            .length.toString()}
          color="text-emerald-400"
          bg="bg-emerald-500/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold font-serif flex items-center gap-3">
              <Clock className="text-indigo-400" size={24} />
              Επόμενοι Γάμοι
            </h3>
            <button className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <div className="glass p-12 rounded-[2rem] text-center text-slate-500 italic border-dashed border-2 border-slate-800">
                Δεν υπάρχουν επερχόμενοι γάμοι.
              </div>
            ) : (
              upcoming.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onNavigateProject(project.id)}
                  className="group glass p-5 rounded-[2rem] flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-all border border-slate-800/50 hover:border-indigo-500/50 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 font-bold shrink-0 transition-transform group-hover:scale-110 ${getUrgencyColor(project.weddingDate)}`}
                    >
                      <span className="text-[10px] uppercase tracking-tighter opacity-80">
                        {project.weddingDate &&
                        !isNaN(new Date(project.weddingDate).getTime())
                          ? new Date(project.weddingDate).toLocaleString(
                              "el-GR",
                              { month: "short" },
                            )
                          : "-"}
                      </span>
                      <span className="text-2xl">
                        {project.weddingDate &&
                        !isNaN(new Date(project.weddingDate).getTime())
                          ? new Date(project.weddingDate).getDate()
                          : "-"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xl text-slate-50 truncate group-hover:text-indigo-400 transition-colors">
                        {project.coupleNames}
                      </h4>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <span className="truncate">{project.location}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="truncate">{project.style}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${STATUS_COLORS[project.status]}`}
                    >
                      {
                        STATUS_LABELS[
                          project.status as keyof typeof STATUS_LABELS
                        ]
                      }
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                  <div className="sm:hidden text-slate-600">
                    <ChevronRight size={24} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Quick Access - Horizontal on Mobile */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold font-serif flex items-center gap-3">
            <Sparkles className="text-purple-400" size={24} />
            AI Studio
          </h3>

          <div className="flex lg:flex-col gap-4 overflow-x-auto pb-4 lg:pb-0 no-scrollbar snap-x">
            {AI_MODULES.slice(0, 6).map((module) => (
              <button
                key={module.id}
                onClick={() => onNavigateAI(module.id)}
                className="min-w-[200px] lg:min-w-0 glass-dark p-5 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center gap-4 hover:bg-slate-800/60 transition-all text-left group border border-slate-800/50 hover:border-purple-500/50 snap-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                  {module.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-50 mb-1">
                    {module.title}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                    {module.description}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="hidden lg:block text-slate-600 group-hover:text-slate-50 transition-colors"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div
    className={`glass p-5 md:p-6 rounded-[2rem] border border-slate-800/50 relative overflow-hidden group hover:border-indigo-500/30 transition-all`}
  >
    <div
      className={`absolute -right-4 -top-4 w-16 h-16 ${bg} rounded-full blur-2xl group-hover:scale-150 transition-transform`}
    ></div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl ${bg} ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-50 mb-1 tracking-tight">
        {value}
      </p>
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </div>
  </div>
);

export default Dashboard;
