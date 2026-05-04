import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Lock, ChevronRight, Rocket, Star, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Module, ModuleProgress } from '../lib/supabase';
import logoUrl from '/logo.png';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi! ☀️';
  if (h < 15) return 'Selamat Siang! ☀️';
  if (h < 18) return 'Selamat Sore! 🌅';
  return 'Selamat Malam! 🌙';
}

interface ModuleWithProgress extends Module {
  prog?: ModuleProgress;
  percent: number;
}

export default function Home() {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [resumeModule, setResumeModule] = useState<ModuleWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setIsLoading(true);
    try {
      const [modsRes, progressRes] = await Promise.all([
        supabase.from('modules').select('*').eq('is_visible', true).order('week', { ascending: true }),
        user
          ? supabase.from('module_progress').select('*').eq('student_nim', user.nim)
          : Promise.resolve({ data: [] }),
      ]);

      const mods: Module[] = modsRes.data || [];
      const progressList: ModuleProgress[] = (progressRes.data as ModuleProgress[]) || [];

      const progressMap: Record<string, ModuleProgress> = {};
      progressList.forEach((p) => { progressMap[p.module_id] = p; });

      const enriched: ModuleWithProgress[] = mods.map((m) => {
        const prog = progressMap[m.id];
        const totalSteps = Array.isArray(m.steps) ? m.steps.length : 0;
        const doneSteps = prog?.completed_steps?.length ?? 0;
        const percent = prog?.is_completed ? 100 : (totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0);
        return { ...m, prog, percent };
      });

      setModules(enriched);

      const incomplete = enriched.find((m) => !m.prog?.is_completed);
      setResumeModule(incomplete ?? enriched[enriched.length - 1] ?? null);
    } finally {
      setIsLoading(false);
    }
  }

  const initials = user?.nama
    ? user.nama.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'G';

  return (
    <div className="bg-slate-50 font-[Inter,sans-serif] min-h-screen selection:bg-blue-500/30 w-full pb-20">
      <div className="w-full px-6 lg:px-12 py-8 relative flex flex-col gap-10">
        
        {/* ── Header (Mobile only) ── */}
        <header className="lg:hidden flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">RekaFisika</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform Belajar Fisika</p>
            </div>
          </div>
          <Link to="/profil" className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
            {initials}
          </Link>
        </header>

        {/* ── Desktop Greeting ── */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <p className="text-blue-600 font-bold text-sm mb-1 uppercase tracking-[0.2em]">{getGreeting()}</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Halo, {user?.nama?.split(' ')[0] || 'Teman Belajar'}! 👋</h2>
          <p className="text-slate-500 mt-2 text-lg">Siap untuk petualangan fisika baru hari ini?</p>
        </motion.div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col gap-12">
          
          {/* Resume Banner (Big & Bold) */}
          {resumeModule && (
            <motion.div 
              initial={{ opacity: 0, y: 24 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Link
                to={`/detail-modul/${resumeModule.id}`}
                className="block relative bg-slate-900 rounded-[3rem] p-8 lg:p-12 text-white shadow-2xl shadow-slate-900/40 overflow-hidden group hover:scale-[1.005] transition-transform duration-500"
              >
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 backdrop-blur-sm">
                        {resumeModule.prog?.is_completed ? 'Review Sesi' : 'Lanjutkan Materi Terakhir'}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} /> {resumeModule.week} Minggu Lalu
                      </div>
                    </div>
                    
                    <h2 className="text-4xl lg:text-5xl font-black mb-2 leading-[1.1] tracking-tight">{resumeModule.topic}</h2>
                    <p className="text-slate-400 text-lg lg:text-xl max-w-xl line-clamp-2">{resumeModule.description || 'Pelajari konsep fisika ini dengan simulasi interaktif.'}</p>
                    
                    <div className="flex items-center gap-6 pt-4">
                      <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${resumeModule.percent}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="bg-gradient-to-r from-blue-400 to-indigo-400 h-full rounded-full shadow-[0_0_20px_rgba(96,165,250,0.5)]" 
                        />
                      </div>
                      <span className="text-2xl font-black font-mono text-white">{resumeModule.percent}%</span>
                    </div>
                  </div>

                  <div className="relative shrink-0 flex items-center justify-center lg:w-64 lg:h-64">
                     <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                     <Rocket size={160} className="relative z-10 text-white/90 -rotate-12 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-700 ease-out" />
                  </div>
                </div>

                <div className="absolute bottom-8 right-12 hidden lg:flex items-center gap-2 text-blue-400 font-black uppercase tracking-widest text-xs">
                   Mulai Sekarang <ArrowRight size={16} />
                </div>
              </Link>
            </motion.div>
          )}

          {/* Module Grid Section */}
          <div className="space-y-8">
            <div className="flex items-end justify-between px-2">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Katalog Modul</h3>
                <p className="text-slate-400 font-medium mt-1">Eksplorasi materi fisika terapan secara interaktif.</p>
              </div>
              <Link to="/modul" className="hidden sm:flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
                Lihat Semua <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((_) => (
                  <div key={_} className="bg-white p-8 rounded-[2.5rem] h-64 animate-pulse shadow-sm border border-slate-100" />
                ))
              ) : modules.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/detail-modul/${item.id}`}
                    className={`group block relative bg-white p-8 rounded-[3rem] border-2 transition-all duration-500 h-full flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 ${
                      item.is_locked ? 'opacity-60 grayscale cursor-not-allowed border-slate-100' : 'border-transparent hover:border-blue-500/20'
                    }`}
                  >
                    {/* Status badge */}
                    <div className="flex items-center justify-between mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                        item.prog?.is_completed ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                        {item.is_locked ? <Lock size={24} /> : (item.prog?.is_completed ? <CheckCircle2 size={28} /> : <BookOpen size={28} />)}
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        Minggu {item.week}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors">{item.topic}</h4>
                      <p className="text-slate-500 text-sm font-medium line-clamp-3 leading-relaxed">{item.description || 'Pelajari bab ini untuk memahami prinsip dasar fisika melalui simulasi interaktif dan latihan terpandu.'}</p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-50">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Belajar</span>
                         <span className="text-xs font-black text-slate-900">{item.percent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${item.prog?.is_completed ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                          style={{ width: `${item.percent}%` }} 
                        />
                      </div>
                    </div>

                    {/* Hover effect decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

        <div className="text-center py-10">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">RekaFisika • Digital Learning Ecosystem</p>
        </div>
      </div>
    </div>
  );
}
