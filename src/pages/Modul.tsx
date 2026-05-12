import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Lock, ChevronRight, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Module } from '../lib/supabase';

export default function Modul() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    setIsLoading(true);
    try {
      const { data: mods, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setModules(mods || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full px-6 lg:px-12 py-8 space-y-8 pb-24">
      {/* Header */}
      <div>
        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] block mb-2">
          Kurikulum Fisika
        </span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Jelajah Materi</h1>
        <p className="text-slate-500 mt-2 max-w-md">
          Temukan berbagai topik fisika menarik yang disajikan secara interaktif dan mudah dipahami.
        </p>
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white p-8 rounded-[2.5rem] h-48 border border-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link
                to={`/detail-modul/${item.id}`}
                className={`group block p-6 h-full rounded-[2.5rem] border-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  item.is_locked
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border-transparent hover:border-blue-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110 duration-300 ${
                        item.is_locked ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-500'
                      }`}
                    >
                      {item.is_locked ? <Lock size={20} /> : <BookOpen size={20} />}
                    </div>
                    {item.kategori && (
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {item.kategori}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {item.topic}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {item.description || 'Pelajari konsep dasar dan penerapan praktis dari topik ini.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap size={11} className="text-slate-300" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      {item.steps?.length || 0} Langkah
                    </span>
                  </div>
                  {!item.is_locked && (
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
