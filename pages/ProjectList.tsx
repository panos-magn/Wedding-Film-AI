import * as React from "react";
import { useState } from "react";
import { Project, ProjectStatus } from "../types";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  MapPin,
  Calendar,
  Sparkles,
  X,
  ChevronDown,
  FolderKanban,
} from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onAddProject: (p: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onAddProject,
}) => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">(
    "all",
  );

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.coupleNames.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 pb-24 lg:pb-0 w-full min-w-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold font-serif text-slate-50 tracking-tight">
            Τα Έργα σας
          </h2>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">
            Manage your wedding portfolio & clients
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-[2rem] font-bold transition-all shadow-2xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={24} />
          <span>Νέο Έργο</span>
        </button>
      </header>

      {/* Search & Filter Bar */}
      <div className="sticky top-20 lg:top-0 z-30 flex flex-col gap-6 bg-slate-950/90 backdrop-blur-2xl py-6 -mx-6 px-6 lg:mx-0 lg:px-0 border-b border-slate-800/50 lg:border-none">
        <div className="relative group">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
            size={22}
          />
          <input
            type="text"
            placeholder="Αναζήτηση ζευγαριού ή τοποθεσίας..."
            className="w-full pl-16 pr-8 py-6 bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 transition-all placeholder:text-slate-600 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-8 py-4 rounded-full font-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${
              filterStatus === "all"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                : "bg-slate-900/50 border-slate-800/50 text-slate-500 hover:border-slate-700"
            }`}
          >
            Όλα τα Έργα
          </button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as any)}
              className={`px-8 py-4 rounded-full font-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${
                filterStatus === key
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                  : "bg-slate-900/50 border-slate-800/50 text-slate-500 hover:border-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.length === 0 ? (
          <div className="col-span-full py-40 text-center bg-slate-900/20 rounded-[4rem] border-dashed border-2 border-slate-800/50">
            <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-8 text-indigo-400">
              <FolderKanban size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-50 font-serif mb-2">
              Κανένα Έργο
            </h3>
            <p className="text-slate-500 font-medium">
              Ξεκινήστε δημιουργώντας το πρώτο σας έργο γάμου!
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-40 text-center bg-slate-900/20 rounded-[4rem] border-dashed border-2 border-slate-800/50">
            <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700">
              <Search size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-50 font-serif mb-2">
              Δεν βρέθηκαν έργα
            </h3>
            <p className="text-slate-500 font-medium">
              Δοκιμάστε να αλλάξετε τα φίλτρα ή την αναζήτηση.
            </p>
          </div>
        ) : (
          filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="group relative bg-slate-900/40 rounded-[3rem] overflow-hidden hover:bg-slate-900/60 transition-all cursor-pointer border border-slate-800/50 hover:border-indigo-500/30 flex flex-col h-full active:scale-[0.98] shadow-2xl shadow-indigo-600/5"
            >
              <div className="p-10 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-slate-50 group-hover:text-indigo-400 transition-colors leading-tight font-serif">
                      {project.coupleNames}
                    </h3>
                    <div className="flex items-center gap-2 text-indigo-500/70 text-[10px] font-bold uppercase tracking-[0.2em]">
                      <Calendar size={14} />
                      {project.weddingDate &&
                      !isNaN(new Date(project.weddingDate).getTime())
                        ? new Date(project.weddingDate).toLocaleDateString(
                            "el-GR",
                            { year: "numeric", month: "long", day: "numeric" },
                          )
                        : "Χωρίς Ημερομηνία"}
                    </div>
                  </div>
                </div>

                <div className="space-y-5 mb-10">
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/50 flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors border border-slate-800/50">
                      <MapPin size={20} />
                    </div>
                    <span className="font-semibold text-lg truncate">
                      {project.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/50 flex items-center justify-center text-slate-600 group-hover:text-purple-400 transition-colors border border-slate-800/50">
                      <Sparkles size={20} />
                    </div>
                    <span className="font-semibold text-lg truncate">
                      {project.style}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-800/50 flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500"
                      >
                        {i}
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-4 border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-600/20">
                      +
                      {
                        Object.values(project.deliverables).filter(Boolean)
                          .length
                      }
                    </div>
                  </div>
                  <span
                    className={`px-5 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] border uppercase ${STATUS_COLORS[project.status]}`}
                  >
                    {
                      STATUS_LABELS[
                        project.status as keyof typeof STATUS_LABELS
                      ]
                    }
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-28 right-8 w-18 h-18 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/40 active:scale-90 transition-all z-40 border-4 border-slate-950"
      >
        <Plus size={36} />
      </button>

      {isModalOpen && (
        <ProjectModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={(p: Project) => {
            onAddProject(p);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const ProjectModal = ({ onClose, onSubmit }: any) => {
  const [form, setForm] = useState({
    coupleNames: "",
    weddingDate: "",
    location: "",
    style: "Cinematic",
    status: "booked" as ProjectStatus,
    email: "",
    phone: "",
    packageName: "",
    totalAmount: 0,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-slate-950/30">
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-serif text-slate-50">
              Νέο Έργο
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Create a new wedding project
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-50 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
              Ονόματα Ζευγαριού
            </label>
            <input
              type="text"
              value={form.coupleNames}
              onChange={(e) =>
                setForm({ ...form, coupleNames: e.target.value })
              }
              className="w-full bg-slate-950/50 p-5 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 outline-none border border-slate-800 text-slate-50"
              placeholder="π.χ. Γιάννης & Ελένη"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
              Ημερομηνία Γάμου
            </label>
            <input
              type="date"
              value={form.weddingDate}
              onChange={(e) =>
                setForm({ ...form, weddingDate: e.target.value })
              }
              className="w-full bg-slate-950/50 p-5 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 outline-none border border-slate-800 text-slate-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
              Τοποθεσία
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full bg-slate-950/50 p-5 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 outline-none border border-slate-800 text-slate-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
              Στυλ Ταινίας
            </label>
            <div className="relative group">
              <select
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
                className="w-full bg-slate-950/50 p-5 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 outline-none border border-slate-800 text-slate-50 appearance-none"
              >
                <option>Cinematic</option>
                <option>Documentary</option>
                <option>Vintage</option>
                <option>Modern</option>
                <option>Boho</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
              Email Πελάτη
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-950/50 p-5 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 outline-none border border-slate-800 text-slate-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
              Όνομα Πακέτου
            </label>
            <input
              type="text"
              value={form.packageName}
              onChange={(e) =>
                setForm({ ...form, packageName: e.target.value })
              }
              className="w-full bg-slate-950/50 p-5 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 outline-none border border-slate-800 text-slate-50"
            />
          </div>
        </div>
        <div className="p-8 bg-slate-950/50 border-t border-slate-800/50 flex flex-col md:flex-row justify-end gap-4">
          <button
            onClick={onClose}
            className="px-8 py-5 rounded-[1.5rem] text-slate-500 hover:text-slate-50 transition-colors font-bold uppercase text-xs tracking-widest order-2 md:order-1"
          >
            Ακύρωση
          </button>
          <button
            onClick={() =>
              onSubmit({
                id: Date.now().toString(),
                ...form,
                notes: "",
                contact: { email: form.email, phone: form.phone, whatsapp: "" },
                payments: {
                  packageName: form.packageName,
                  totalAmount: form.totalAmount,
                  depositPaid: false,
                  balancePaid: false,
                },
                deliverables: {
                  highlightFilm: false,
                  fullFilm: false,
                  socialMediaContent: false,
                  usbBox: false,
                  onlineLink: false,
                },
                deadline: "",
                createdAt: new Date().toISOString(),
              })
            }
            className="px-10 py-5 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all order-1 md:order-2 shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            Δημιουργία Έργου
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
