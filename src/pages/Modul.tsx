import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Module, ModuleProgress } from '../lib/supabase';

interface ModuleWithProgress extends Module {
  prog?: ModuleProgress;
  percent: number;
}

export default function Modul() {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadModules() {
    setIsLoading(true);
    try {
      const { data: mods, error: modsErr } = await supabase
        .from('modules')
        .select('*')
        .eq('is_visible', true)
        .order('week', { ascending: true });

      if (modsErr) throw modsErr;

      let progressMap: Record<string, ModuleProgress> = {};
      if (user) {
        const { data: progressList } = await supabase.from('module_progress').select('*').eq('student_nim', user.nim);
        if (progressList) progressList.forEach((p) => { progressMap[p.module_id] = p; });
      }

      const enriched: ModuleWithProgress[] = (mods || []).map((m: Module) => {
        const prog = progressMap[m.id];
        const totalSteps = Array.isArray(m.steps) ? m.steps.length : 0;
        const percent = prog?.is_completed ? 100 : (totalSteps > 0 ? Math.round((prog?.completed_steps?.length ?? 0) / totalSteps * 100) : 0);
        return { ...m, prog, percent };
      });

      setModules(enriched);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full px-6 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] block mb-2">Kurikulum Fisika</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Jelajah Materi</h1>
          <p className="text-slate-500 mt-2 max-w-md">Temukan berbagai topik fisika menarik yang disajikan secara interaktif dan mudah dipahami.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Progress Total</p>
            <p className="text-sm font-black text-slate-700">{modules.filter(m => m.prog?.is_completed).length} / {modules.length} Selesai</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="animate-pulse bg-white p-8 rounded-[2.5rem] h-48 border border-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <Link
                to={`/detail-modul/${item.id}`}
                className={`group block p-6 h-full rounded-[2.5rem] border transition-all relative overflow-hidden flex flex-col justify-between ${
                  item.is_locked ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' : 
                  item.prog?.is_completed ? 'bg-emerald-50/30 border-emerald-100 hover:shadow-xl' : 'bg-white border-slate-100 hover:shadow-xl hover:border-primary-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                      item.is_locked ? 'bg-slate-200 text-slate-400' : (item.prog?.is_completed ? 'bg-emerald-500 text-white' : 'bg-primary-50 text-primary-500')
                    }`}>
                      {item.is_locked ? <Lock /> : (item.prog?.is_completed ? <CheckCircle2 /> : <BookOpen />)}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Minggu {item.week}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 group-hover:text-primary-600 transition-colors">{item.topic}</h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-8">{item.description || 'Pelajari konsep dasar dan penerapan praktis dari topik ini.'}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className={item.prog?.is_completed ? 'text-emerald-600' : 'text-slate-400'}>Progress</span>
                    <span className="text-slate-800">{item.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${item.prog?.is_completed ? 'bg-emerald-500' : 'bg-primary-500'}`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>

                {!item.is_locked && (
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronRight size={20} className="text-primary-400" />
                   </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
