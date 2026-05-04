import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Lock, ChevronRight, Route } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Module, ModuleProgress, LearningPath } from '../lib/supabase';
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
}

export default function Home() {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [featuredPath, setFeaturedPath] = useState<LearningPath | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setIsLoading(true);
    try {
      const [modsRes, progressRes, pathsRes] = await Promise.all([
        supabase.from('modules').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
        user
          ? supabase.from('module_progress').select('*').eq('student_nim', user.nim)
          : Promise.resolve({ data: [] }),
        supabase.from('learning_paths').select('*, learning_path_modules(module_id)').eq('is_visible', true)
      ]);

      const mods: Module[] = modsRes.data || [];
      const progressList: ModuleProgress[] = (progressRes.data as ModuleProgress[]) || [];
      const pathList: LearningPath[] = pathsRes.data || [];

      const progressMap: Record<string, ModuleProgress> = {};
      progressList.forEach((p) => { progressMap[p.module_id] = p; });

      const enriched: ModuleWithProgress[] = mods.map((m) => {
        const prog = progressMap[m.id];
        return { ...m, prog };
      });

      setModules(enriched);
      setPaths(pathList);
      
      if (pathList.length > 0) {
        setFeaturedPath(pathList[0]);
      }

      // Check for active teacher session
      if (user?.teaching_code && (user.role === 'teacher' || user.role === 'admin')) {
        const { data: session } = await supabase
          .from('sesi_kelas')
          .select('*, modules(topic)')
          .eq('kode_kelas', user.teaching_code.trim().toUpperCase())
          .maybeSingle();
        
        if (session) {
          setActiveSession(session);
        }
      }
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
        
        {/* ── Header ── */}
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
        <div className="flex flex-col gap-16">
          
          {/* Active Session Recovery Banner (Teacher Only) */}
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Sesi Sedang Berjalan</p>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black tracking-tight">
                    {activeSession.modules?.topic || 'Materi Sedang Diajarkan'}
                  </h3>
                  <p className="text-blue-100 text-sm font-medium opacity-80">
                    Siswa sedang menunggu di halaman {activeSession.halaman_aktif || 'awal'}.
                  </p>
                </div>
                <Link
                  to={`/detail-modul/${activeSession.module_id}${activeSession.path_id ? `?path=${activeSession.path_id}` : ''}`}
                  className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group-hover:scale-105 active:scale-95"
                >
                  Lanjutkan Mengajar <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          )}
          
          {/* Featured Path Banner */}
          {featuredPath && (
            <motion.div 
              initial={{ opacity: 0, y: 24 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Link
                to={`/detail-modul/${featuredPath.learning_path_modules?.[0]?.module_id}?path=${featuredPath.id}`}
                className="block relative bg-slate-900 rounded-[3rem] p-8 lg:p-12 text-white shadow-2xl shadow-slate-900/40 overflow-hidden group hover:scale-[1.005] transition-transform duration-500"
              >
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                <div className="relative z-10">
                  <div className="space-y-6">
                    <h2 className="text-4xl lg:text-6xl font-black mb-2 leading-[1.1] tracking-tight">{featuredPath.title}</h2>
                    <p className="text-slate-400 text-lg lg:text-xl max-w-2xl line-clamp-3">{featuredPath.description || 'Alur pembelajaran terstruktur yang sering digunakan untuk penguasaan materi yang mendalam.'}</p>
                    
                    <div className="flex items-center gap-4 pt-4">
                       <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Materi</p>
                          <p className="text-xl font-black text-white">{featuredPath.learning_path_modules?.length || 0} Modul</p>
                       </div>
                       <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                          <p className="text-xl font-black text-emerald-400 flex items-center gap-2">Populer <CheckCircle2 size={18} /></p>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-8 right-12 hidden lg:flex items-center gap-2 text-purple-400 font-black uppercase tracking-widest text-xs">
                   Mulai Rangkaian <ChevronRight size={16} />
                </div>
              </Link>
            </motion.div>
          )}

          {/* Rangkaian Ajar List Section */}
          {paths.length > 0 && (
            <div className="space-y-8">
               <div className="flex items-end justify-between px-2">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Route className="text-purple-600" size={32} /> Pilihan Rangkaian
                  </h3>
                  <p className="text-slate-400 font-medium mt-1">Alur materi terstruktur untuk penguasaan konsep yang mendalam.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {paths.map((path, idx) => (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link
                      to={`/detail-modul/${path.learning_path_modules?.[0]?.module_id}?path=${path.id}`}
                      className="group block relative bg-white p-10 rounded-[3rem] border-2 border-transparent hover:border-purple-500/20 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2"
                    >
                      <div className="flex justify-between items-start mb-8">
                         <div className="w-16 h-16 rounded-[2rem] bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Route size={32} />
                         </div>
                         <div className="flex -space-x-4">
                            {[1, 2, 3].map(s => (
                              <div key={s} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                {s}
                              </div>
                            ))}
                         </div>
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">{path.title}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-2">{path.description}</p>
                      
                      <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 px-4 py-2 rounded-full">
                          {path.learning_path_modules?.length || 0} Materi Berurutan
                        </span>
                        <div className="flex items-center gap-2 text-slate-300 font-black text-xs uppercase tracking-widest group-hover:text-purple-600 transition-colors">
                          Mulai Alur <ChevronRight size={16} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Module Grid Section */}
          <div className="space-y-8">
            <div className="flex items-end justify-between px-2">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <BookOpen className="text-blue-600" size={32} /> Katalog Modul
                </h3>
                <p className="text-slate-400 font-medium mt-1">Eksplorasi materi fisika terapan secara mandiri.</p>
              </div>
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
                    <div className="flex items-center justify-between mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                        item.prog?.is_completed ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                        {item.is_locked ? <Lock size={24} /> : (item.prog?.is_completed ? <CheckCircle2 size={28} /> : <BookOpen size={28} />)}
                      </div>
                      {item.prog?.is_completed && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Selesai</span>}
                    </div>

                    <div>
                      <h4 className="text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors">{item.topic}</h4>
                      <p className="text-slate-500 text-sm font-medium line-clamp-3 leading-relaxed">{item.description || 'Pelajari bab ini untuk memahami prinsip dasar fisika melalui simulasi interaktif.'}</p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Akses Mandiri</span>
                       <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={20} />
                    </div>
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
