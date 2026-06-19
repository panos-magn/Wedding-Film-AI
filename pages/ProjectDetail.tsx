import * as React from "react";
import { useState } from "react";
import { Project, AIModuleType, Deliverables } from "../types";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Phone,
  ExternalLink,
  Clock,
  CheckCircle,
  Wallet,
  ListChecks,
  Sparkles,
  ChevronRight,
  Save,
  X,
  Calendar,
  MapPin,
  FileText,
  FileDown,
  FileSignature,
} from "lucide-react";
import { motion } from "framer-motion";
import { STATUS_COLORS, AI_MODULES, STATUS_LABELS } from "../constants";
import {
  exportProjectToPDF,
  exportContractToPDF,
} from "../services/PDFService";

interface ProjectDetailProps {
  project: Project;
  userProfile: any;
  onUpdateProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onBack: () => void;
  onNavigateAI: (moduleId: AIModuleType) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  userProfile,
  onUpdateProject,
  onDeleteProject,
  onBack,
  onNavigateAI,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project>(project);
  const [activeTab, setActiveTab] = useState<"overview" | "checklist" | "ai">(
    "overview",
  );

  const handleSave = () => {
    onUpdateProject(editedProject);
    setIsEditing(false);
  };

  const toggleDeliverable = (key: keyof Deliverables) => {
    const updated = {
      ...project,
      deliverables: {
        ...project.deliverables,
        [key]: !project.deliverables[key],
      },
    };
    onUpdateProject(updated);
  };

  const togglePayment = (key: "depositPaid" | "balancePaid") => {
    const updated = {
      ...project,
      payments: { ...project.payments, [key]: !project.payments[key] },
    };
    onUpdateProject(updated);
  };

  const getDaysRemaining = () => {
    if (!project.weddingDate) return "-";
    const diff = new Date(project.weddingDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return isNaN(days) ? "-" : days;
  };

  const deliverableLabels: Record<keyof Deliverables, string> = {
    highlightFilm: "Highlight Film",
    fullFilm: "Πλήρης Ταινία",
    socialMediaContent: "Content για Social",
    usbBox: "USB Box",
    onlineLink: "Online Σύνδεσμος",
  };

  const completedDeliverables = Object.values(project.deliverables).filter(
    Boolean,
  ).length;
  const totalDeliverables = Object.keys(project.deliverables).length;
  const progress = (completedDeliverables / totalDeliverables) * 100;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-24 lg:pb-0 w-full min-w-0">
      {/* Top Navigation & Actions */}
      <div className="sticky top-20 lg:top-0 z-40 bg-slate-950/80 backdrop-blur-xl py-4 -mx-6 px-6 lg:mx-0 lg:px-0 flex items-center justify-between border-b border-slate-800/50 lg:border-none">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-50 transition-colors py-2 group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </div>
          <span className="hidden sm:inline font-bold">Επιστροφή</span>
        </button>

        <div className="flex gap-2">
          {!isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => exportProjectToPDF(project, userProfile)}
                className="p-3 glass text-sky-400 hover:bg-sky-500/10 rounded-2xl transition-all"
                title="Report"
              >
                <FileDown size={20} />
              </button>
              <button
                onClick={() => exportContractToPDF(project, userProfile)}
                className="p-3 glass text-purple-400 hover:bg-purple-500/10 rounded-2xl transition-all"
                title="Συμβόλαιο"
              >
                <FileSignature size={20} />
              </button>
            </div>
          )}
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Save size={20} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 glass text-indigo-400 hover:bg-indigo-500/10 rounded-2xl transition-all"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => onDeleteProject(project.id)}
                className="p-3 glass text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Header Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900/40 border border-slate-800/50 p-8 md:p-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <span
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest border uppercase ${STATUS_COLORS[project.status]}`}
            >
              {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS]}
            </span>
            {isEditing ? (
              <input
                className="text-4xl md:text-5xl font-bold font-serif bg-slate-800/50 rounded-2xl px-6 py-3 w-full focus:ring-2 focus:ring-indigo-500/30 outline-none border border-slate-700"
                value={editedProject.coupleNames}
                onChange={(e) =>
                  setEditedProject({
                    ...editedProject,
                    coupleNames: e.target.value,
                  })
                }
              />
            ) : (
              <h2 className="text-4xl md:text-6xl font-bold font-serif text-slate-50 leading-tight">
                {project.coupleNames}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-6 text-slate-400 font-medium">
              <span className="flex items-center gap-2">
                <Calendar size={20} className="text-indigo-500" />{" "}
                {project.weddingDate &&
                !isNaN(new Date(project.weddingDate).getTime())
                  ? new Date(project.weddingDate).toLocaleDateString("el-GR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Χωρίς Ημερομηνία"}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={20} className="text-indigo-500" />{" "}
                {project.location}
              </span>
            </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[2rem] min-w-[180px] text-center md:text-left">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2">
              Days to Wedding
            </p>
            <div className="text-5xl font-bold text-slate-50 flex items-baseline justify-center md:justify-start gap-2">
              {getDaysRemaining()}{" "}
              <span className="text-sm font-normal text-slate-500 uppercase tracking-widest">
                Days
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl"></div>
      </section>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex p-1 bg-slate-900/50 rounded-2xl border border-slate-800/50">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "overview" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex-1 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "checklist" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500"}`}
        >
          Checklist
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "ai" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500"}`}
        >
          AI Tools
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Overview Tab Content */}
        <div
          className={`lg:col-span-2 space-y-10 ${activeTab !== "overview" && "hidden lg:block"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Card */}
            <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-3 font-serif text-slate-50">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Phone size={20} />
                </div>
                Επικοινωνία
              </h3>
              <div className="space-y-4">
                <a
                  href={`mailto:${project.contact.email}`}
                  className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Mail
                      size={18}
                      className="text-slate-500 group-hover:text-indigo-400 transition-colors"
                    />
                    <span className="text-sm font-medium truncate text-slate-300">
                      {project.contact.email}
                    </span>
                  </div>
                  <ExternalLink
                    size={16}
                    className="text-slate-700 group-hover:text-indigo-400"
                  />
                </a>
                <a
                  href={`tel:${project.contact.phone}`}
                  className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Phone
                      size={18}
                      className="text-slate-500 group-hover:text-indigo-400 transition-colors"
                    />
                    <span className="text-sm font-medium truncate text-slate-300">
                      {project.contact.phone}
                    </span>
                  </div>
                  <ExternalLink
                    size={16}
                    className="text-slate-700 group-hover:text-indigo-400"
                  />
                </a>
              </div>
            </div>

            {/* Financial Card */}
            <div className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-3 font-serif text-slate-50">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Wallet size={20} />
                </div>
                Οικονομικά
              </h3>
              <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {project.payments.packageName}
                  </span>
                  <span className="text-3xl font-bold text-slate-50">
                    €{project.payments.totalAmount}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => togglePayment("depositPaid")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${project.payments.depositPaid ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-slate-900/30 border-slate-800 text-slate-500"}`}
                  >
                    <CheckCircle
                      size={24}
                      className={
                        project.payments.depositPaid
                          ? "text-emerald-400"
                          : "text-slate-700"
                      }
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Προκαταβολή
                    </span>
                  </button>
                  <button
                    onClick={() => togglePayment("balancePaid")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${project.payments.balancePaid ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-slate-900/30 border-slate-800 text-slate-500"}`}
                  >
                    <CheckCircle
                      size={24}
                      className={
                        project.payments.balancePaid
                          ? "text-emerald-400"
                          : "text-slate-700"
                      }
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Εξόφληση
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <section className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-3 font-serif text-slate-50">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <FileText size={20} />
              </div>
              Σημειώσεις Έργου
            </h3>
            <textarea
              className="w-full bg-slate-950/50 p-6 rounded-[2rem] min-h-[200px] text-slate-300 outline-none focus:ring-2 focus:ring-amber-500/20 border border-slate-800 transition-all text-lg placeholder:text-slate-700"
              placeholder="Add project details, gear requirements, or couple preferences..."
              value={project.notes}
              onChange={(e) =>
                onUpdateProject({ ...project, notes: e.target.value })
              }
            ></textarea>
          </section>
        </div>

        {/* Checklist Tab Content */}
        <div
          className={`space-y-8 ${activeTab !== "checklist" && "hidden lg:block"}`}
        >
          <section className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-3 font-serif text-slate-50">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <ListChecks size={20} />
                </div>
                Παραδοτέα
              </h3>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {completedDeliverables}/{totalDeliverables}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-500"
              />
            </div>

            <div className="space-y-3">
              {(
                Object.keys(project.deliverables) as (keyof Deliverables)[]
              ).map((deliverableKey) => (
                <button
                  key={String(deliverableKey)}
                  onClick={() => toggleDeliverable(deliverableKey)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${project.deliverables[deliverableKey] ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400" : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700"}`}
                >
                  <span className="text-sm font-bold uppercase tracking-widest">
                    {deliverableLabels[deliverableKey] ||
                      String(deliverableKey)}
                  </span>
                  {project.deliverables[deliverableKey] ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                      <CheckCircle size={16} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-700"></div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* AI Tools Tab Content */}
        <div className={`space-y-8 ${activeTab !== "ai" && "hidden lg:block"}`}>
          <section className="bg-slate-900/40 border border-slate-800/50 p-8 rounded-[2.5rem] space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-3 font-serif text-slate-50">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Sparkles size={20} />
              </div>
              AI Studio
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {AI_MODULES.slice(0, 8).map((module) => (
                <button
                  key={module.id}
                  onClick={() => onNavigateAI(module.id)}
                  className="group bg-slate-950/50 p-6 rounded-3xl flex flex-col items-center gap-4 hover:bg-slate-800/60 transition-all border border-slate-800 hover:border-purple-500/30 text-center active:scale-95"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">
                    {module.icon}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-50">
                    {module.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
