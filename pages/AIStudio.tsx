
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Project, AIModuleType, AIResult, UserProfile } from '../types';
import { Sparkles, Send, Loader2, Save, Trash2, History, ChevronDown, Check, ExternalLink, Menu, FileDown, AlertTriangle, X } from 'lucide-react';
import { AI_MODULES } from '../constants';
import { auth } from '../services/firebase';
import { generateAIContent } from '../services/geminiService';
import { exportAIResultToPDF } from '../services/PDFService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface AIStudioProps {
  projects: Project[];
  userProfile: UserProfile;
  initialProjectId?: string | null;
  initialModuleId?: AIModuleType | null;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  savedResults: AIResult[];
  onSaveResult: (result: AIResult) => Promise<void>;
  onDeleteResult: (id: string) => Promise<void>;
}

const AIStudio: React.FC<AIStudioProps> = ({ 
  projects, 
  userProfile, 
  initialProjectId, 
  initialModuleId, 
  onShowToast,
  savedResults,
  onSaveResult,
  onDeleteResult
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || (projects[0]?.id || ''));
  const [selectedModuleId, setSelectedModuleId] = useState<AIModuleType>(initialModuleId || 'shot-planning');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedModule = AI_MODULES.find(m => m.id === selectedModuleId)!;

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);

  useEffect(() => {
    if (initialProjectId) setSelectedProjectId(initialProjectId);
    if (initialModuleId) setSelectedModuleId(initialModuleId);
  }, [initialProjectId, initialModuleId]);

  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasGeminiKey === 'boolean') {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch((err) => console.error("Error checking key status:", err));
  }, []);

  const handleGenerate = async () => {
    if (!selectedProject) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const output = await generateAIContent(
        selectedModule,
        selectedProject,
        inputs,
        auth.currentUser?.uid || ""
      );
      setResult(output);
      // Scroll to result on mobile
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (err: any) {
      onShowToast(`Σφάλμα: ${err.message || "Αποτυχία παραγωγής περιεχομένου."}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result || !selectedProject) return;
    const newResult: AIResult = {
      id: '',
      projectId: selectedProjectId,
      moduleType: selectedModuleId,
      title: `${selectedModule.title} για ${selectedProject.coupleNames}`,
      content: result,
      createdAt: new Date().toISOString()
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
          <h2 className="text-4xl font-bold font-serif text-slate-50 tracking-tight">AI Studio</h2>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">Transform your workflow with AI</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl text-slate-400 hover:text-slate-50 transition-all font-bold text-xs uppercase tracking-widest"
        >
          <History size={18} />
          <span>{showHistory ? 'Hide History' : 'View History'}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Mobile Module Toggle Button */}
        <div className="lg:hidden">
          <button 
            onClick={() => setIsModuleSelectorOpen(true)}
            className="w-full bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] flex items-center justify-between border border-indigo-500/20 active:scale-[0.98] transition-transform shadow-2xl shadow-indigo-600/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-3xl border border-indigo-500/20">
                {selectedModule.icon}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Active Tool</p>
                <p className="text-xl font-bold text-slate-50">{selectedModule.title}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <Menu size={20} />
            </div>
          </button>
          
          <AnimatePresence>
            {isModuleSelectorOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsModuleSelectorOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
                />
                
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed inset-x-0 bottom-0 h-[80vh] bg-slate-950 border-t border-slate-800 z-[60] p-8 flex flex-col lg:hidden rounded-t-[3rem] shadow-2xl"
                >
                  <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-8 shrink-0"></div>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold font-serif text-slate-50">AI Studio Tools</h3>
                    <button 
                      onClick={() => setIsModuleSelectorOpen(false)}
                      className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                    {AI_MODULES.map(module => (
                      <button
                        key={module.id}
                        onClick={() => {
                          setSelectedModuleId(module.id);
                          setIsModuleSelectorOpen(false);
                          setResult(null);
                          setInputs({});
                        }}
                        className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all text-left border ${
                          selectedModuleId === module.id 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20' 
                            : 'bg-slate-900/50 border-slate-800/50 text-slate-600 hover:bg-slate-900 hover:text-slate-950'
                        }`}
                      >
                        <span className="text-3xl shrink-0">{module.icon}</span>
                        <div>
                          <p className="font-bold text-lg leading-tight">{module.title}</p>
                          <p className={`text-xs mt-1 leading-relaxed ${selectedModuleId === module.id ? 'text-indigo-100' : 'text-slate-500'}`}>
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

        {/* Sidebar Selector (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-[2.5rem] space-y-6">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2">Select AI Tool</h3>
            <div className="space-y-2">
              {AI_MODULES.map(module => (
                <button
                  key={module.id}
                  onClick={() => {
                    setSelectedModuleId(module.id);
                    setResult(null);
                    setInputs({});
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border ${
                    selectedModuleId === module.id ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-600 shadow-lg shadow-indigo-600/5' : 'text-slate-600 border-transparent hover:text-slate-950 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-2xl shrink-0">{module.icon}</span>
                  <span className="text-sm font-bold truncate">{module.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="lg:col-span-6 space-y-8">
          <div className="bg-slate-900/40 border border-slate-800/50 p-8 md:p-10 rounded-[3rem] space-y-10 shadow-2xl shadow-indigo-600/5">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Project Context</label>
              <div className="relative group">
                <select 
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-950/50 p-6 rounded-[2rem] appearance-none outline-none focus:ring-2 focus:ring-indigo-500/30 pr-14 font-bold text-xl text-slate-50 border border-slate-800 group-hover:border-slate-700 transition-all"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.coupleNames} ({new Date(p.weddingDate).getFullYear()})</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 pointer-events-none">
                  <ChevronDown size={20} />
                </div>
              </div>
              {userProfile.role === 'admin' ? (
                (hasGeminiKey || userProfile.customGeminiApiKey) ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    <Check size={16} /> Λειτουργία: Admin (Σύνδεση με Gemini AI)
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    <AlertTriangle size={16} /> Attention: Gemini API Key is missing. Please configure it in your Settings.
                  </div>
                )
              ) : (
                userProfile.customGeminiApiKey ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    <Check size={16} /> Λειτουργία: Premium Gemini AI (Χρήση προσωπικού σας κλειδιού)
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 p-5 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 text-slate-300">
                    <div className="flex items-center gap-3 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                      <Sparkles size={16} className="text-indigo-400 animate-pulse shrink-0" />
                      <span>Λειτουργία: Local Cinematic Engine (Δωρεάν)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
                      Χρησιμοποιείτε την ενσωματωμένη μηχανή παραγωγής. Για να ενεργοποιήσετε την απεριόριστη, προσαρμοσμένη παραγωγή Gemini AI, μπορείτε προαιρετικά να εισάγετε το δικό σας δωρεάν Gemini API Key στις <strong className="text-indigo-300">API Configuration</strong> ρυθμίσεις του προφίλ σας.
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center text-5xl border border-indigo-500/20 shrink-0 shadow-xl shadow-indigo-600/5">
                  {selectedModule.icon}
                </div>
                <div>
                  <h3 className="text-3xl font-bold font-serif text-slate-50">{selectedModule.title}</h3>
                  <p className="text-slate-500 font-medium mt-1 leading-relaxed">{selectedModule.description}</p>
                </div>
              </div>

              <div className="space-y-8">
                {selectedModule.inputs.map(input => (
                  <div key={input.key} className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">{input.label}</label>
                    {input.type === 'textarea' ? (
                      <textarea
                        value={inputs[input.key] || ''}
                        onChange={e => setInputs({...inputs, [input.key]: e.target.value})}
                        className="w-full bg-slate-950/50 p-6 rounded-[2rem] min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-300 border border-slate-800 transition-all placeholder:text-slate-700"
                        placeholder="Provide specific details to guide the AI..."
                      />
                    ) : input.type === 'select' ? (
                      <div className="relative group">
                        <select
                          value={inputs[input.key] || ''}
                          onChange={e => setInputs({...inputs, [input.key]: e.target.value})}
                          className="w-full bg-slate-950/50 p-6 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg text-slate-50 appearance-none border border-slate-800 group-hover:border-slate-700 transition-all"
                        >
                          <option value="">Select option...</option>
                          {input.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 pointer-events-none">
                          <ChevronDown size={20} />
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={inputs[input.key] || ''}
                        onChange={e => setInputs({...inputs, [input.key]: e.target.value})}
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

          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/40 border border-indigo-500/30 p-12 md:p-20 rounded-[3rem] flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-600/10"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="w-16 h-16 relative bg-indigo-500/10 rounded-[1.5rem] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Sparkles size={32} className="animate-pulse" />
                  </div>
                </div>
                <h4 className="text-2xl font-bold font-serif text-slate-50 mb-2">Δημιουργία Μαγείας...</h4>
                <p className="text-slate-500 font-medium">Το AI αναλύει τις πληροφορίες του γάμου. Παρακαλώ περιμένετε μερικά δευτερόλεπτα.</p>
              </motion.div>
            ) : result ? (
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
                    <h4 className="text-2xl font-bold text-slate-50 font-serif">AI Result</h4>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => exportAIResultToPDF({
                        id: 'temp',
                        projectId: selectedProjectId,
                        moduleType: selectedModuleId,
                        title: `${selectedModule.title} για ${selectedProject?.coupleNames}`,
                        content: result,
                        createdAt: new Date().toISOString()
                      }, userProfile)}
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
            ) : null}
          </AnimatePresence>
        </div>

        {/* History / Saved */}
        <div className={`lg:col-span-3 space-y-6 ${!showHistory && 'hidden lg:block'}`}>
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
                  <p className="text-sm text-slate-500 font-medium italic">No saved results yet.</p>
                </div>
              ) : (
                savedResults.filter(r => r.projectId === selectedProjectId).map(result => (
                  <div key={result.id} className="group bg-slate-950/50 p-5 rounded-[1.5rem] border border-slate-800 hover:border-slate-600 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1 truncate">{result.moduleType.replace('-', ' ')}</p>
                        <p className="text-xs font-bold text-slate-50">{new Date(result.createdAt).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}</p>
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
                        setResult(result.content);
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
      </div>
    </div>
  );
};

export default AIStudio;
