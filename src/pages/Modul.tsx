import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import type { Module, ModuleProgress } from '../lib/supabase';

interface ModuleWithProgress extends Module {
  prog?: ModuleProgress;
  percent: number;
}

export default function Modul() {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadModules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadModules() {
    setIsLoading(true);
    setError('');
    try {
      const { data: mods, error: modsErr } = await supabase
        .from('modules')
        .select('*')
        .eq('is_visible', true)
        .order('week', { ascending: true })
        .order('created_at', { ascending: true });

      if (modsErr) throw modsErr;

      let progressMap: Record<string, ModuleProgress> = {};
      if (user) {
        const { data: progressList } = await supabase
          .from('module_progress')
          .select('*')
          .eq('student_nim', user.nim);
        if (progressList) {
          (progressList as ModuleProgress[]).forEach((p) => {
            progressMap[p.module_id] = p;
          });
        }
      }

      const enriched: ModuleWithProgress[] = (mods || []).map((m: Module) => {
        const prog = progressMap[m.id];
        const totalSteps = Array.isArray(m.steps) ? m.steps.length : 0;
        const doneSteps = prog?.completed_steps?.length ?? 0;
        const percent = prog?.is_completed
          ? 100
          : totalSteps > 0
          ? Math.round((doneSteps / totalSteps) * 100)
          : 0;
        return { ...m, prog, percent };
      });

      setModules(enriched);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat modul.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 font-[Inter,sans-serif] text-slate-800 min-h-screen pb-28 selection:bg-blue-500/30">
      <div className="max-w-2xl mx-auto flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pt-12 pb-6 bg-white sticky top-0 z-40 shadow-sm"
        >
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Jelajah Materi</h1>
          <p className="text-sm text-slate-500 mt-1">Modul pembelajaran Fisika</p>
        </motion.div>

        {/* Content */}
        <main className="px-6 py-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white p-5 rounded-3xl h-28 border border-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-slate-400 mb-4">{error}</p>
              <button
                onClick={loadModules}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
              <p>Belum ada materi tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.map((item, i) => {
                const isCompleted = item.prog?.is_completed;
                const isLocked = item.is_locked;

                if (isLocked) {
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i }}
                      className="group block p-5 rounded-2xl border bg-slate-50 border-slate-200 shadow-sm opacity-75 cursor-not-allowed"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <Lock size={16} className="text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-slate-500 text-base leading-tight line-clamp-2">{item.topic}</h3>
                            <span className="text-[9px] font-bold uppercase bg-slate-200 text-slate-500 px-2 py-0.5 rounded ml-2 shrink-0">LOCKED</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{item.description || 'Pelajari materi ini.'}</p>
                          <div className="mt-3 h-1.5 w-full bg-slate-200 rounded-full" />
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i }}
                  >
                    <Link
                      to={`/detail-modul/${item.id}`}
                      className={`group block p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                        isCompleted
                          ? 'bg-emerald-50/50 border-emerald-100'
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isCompleted ? 'bg-emerald-100' : 'bg-blue-50'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : (
                            <BookOpen size={18} className="text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                              {item.topic}
                            </h3>
                            <ChevronRight
                              size={16}
                              className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5"
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {item.description || 'Pelajari materi ini.'}
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">{item.percent}%</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
