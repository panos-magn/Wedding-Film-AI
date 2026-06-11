import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Film, ArrowRight, Camera, Layout, ChevronRight, Zap, CheckCircle2, Shield } from 'lucide-react';
import { signInWithGoogle } from '../services/firebase';

interface AuthProps {
  onSignInSuccess: (user: any) => void;
  onLoading: (isLoading: boolean) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

const Auth: React.FC<AuthProps> = ({ onSignInSuccess, onLoading, onShowToast }) => {
  const [signingIn, setSigningIn] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    onLoading(true);
    try {
      const user = await signInWithGoogle();
      onShowToast('Επιτυχής σύνδεση!', 'success');
      onSignInSuccess(user);
    } catch (err: any) {
      console.error(err);
      onShowToast('Σφάλμα κατά τη σύνδεση με το Google.', 'error');
    } finally {
      setSigningIn(false);
      onLoading(false);
    }
  };

  const features = [
    {
      icon: <Layout className="text-white" size={20} />,
      color: "bg-indigo-500",
      title: "Οργάνωση Έργων",
      desc: "Διαχειριστείτε όλα τα projects χρονολογικά. Παρακολουθήστε ημερομηνίες, πληρωμές και παραδοτέα σε ένα μέρος."
    },
    {
      icon: <Sparkles className="text-white" size={20} />,
      color: "bg-purple-500",
      title: "AI Shot Planner",
      desc: "H τεχνητή νοημοσύνη δημιουργεί αυτόματα αναλυτικές λίστες πλάνων με βάση το στυλ του γάμου."
    },
    {
      icon: <Camera className="text-white" size={20} />,
      color: "bg-emerald-500",
      title: "Checklist Παραδοτέων",
      desc: "Κρατήστε σημειώσεις για τα deliverables (Trailer, Documentary, Raw) για να μην ξεχνάτε τίποτα."
    },
    {
      icon: <Zap className="text-white" size={20} />,
      color: "bg-amber-500",
      title: "Αυτόματα Κείμενα",
      desc: "Δημιουργήστε emails πελατών, post για social media και terms contracts με ένα κλικ."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
              W
            </div>
            <span className="font-serif font-bold text-xl text-slate-50 tracking-tight">WeddingFilmAI</span>
          </div>
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="hidden sm:flex px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 font-bold text-sm text-white transition-all items-center gap-2"
          >
            Είσοδος <ChevronRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center min-h-[90vh]">
        {/* Ambient Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-[100%] blur-[120px] pointer-events-none" />
        <div className="absolute grid-bg inset-0 opacity-20 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest mb-8 mx-auto"
          >
            <Sparkles size={14} className="text-indigo-400" />
            Το Κορυφαιο Studio για Cinematographers
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.1] font-serif mb-8"
          >
            To AI Studio για
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Wedding Films
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Φέρτε την οργάνωση των projects σας και την παραγωγή σεναρίων στο επόμενο επίπεδο. Ενισχύστε τη δημιουργικότητά σας με εργαλεία τεχνητής νοημοσύνης.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4"
          >
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full sm:w-auto px-8 py-4.5 rounded-full bg-white hover:bg-slate-200 font-bold text-slate-950 shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
            >
              Συνδεθείτε με Google <ArrowRight size={20} />
            </button>
          </motion.div>
          
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
             className="mt-10 flex items-center justify-center gap-6 opacity-60 grayscale text-sm font-bold tracking-widest uppercase"
          >
            <div className="flex items-center gap-2"><CheckCircle2 size={16}/> Δωρεάν Δοκιμή</div>
            <div className="hidden sm:flex items-center gap-2"><Shield size={16}/> Ασφάλεια Δεδομένων</div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 px-6 bg-slate-900/40 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-white mb-4">Λειτουργίες που ξεχωρίζουν</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Ενώστε το workflow σας σε ένα απλό, minimal περιβάλλον φτιαγμένο αποκλειστικά για επαγγελματίες του βίντεο.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] hover:border-indigo-500/30 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-lg ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-white leading-tight">Μεταμορφώστε το Studio σας σήμερα.</h2>
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="px-10 py-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 font-bold text-white text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 mx-auto"
          >
            Συνδεθείτε με Google <ArrowRight size={20} />
          </button>
        </div>
      </section>
      
      <style>{`
        .grid-bg {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, #000 40%, transparent 100%);
        }
      `}</style>
    </div>
  );
};

export default Auth;
