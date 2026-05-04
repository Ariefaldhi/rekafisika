import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Lock, ChevronRight, Bell, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import type { Module, ModuleProgress, Announcement } from '../lib/supabase';
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setIsLoading(true);
    try {
      const [modsRes, progressRes, annoRes] = await Promise.all([
        supabase.from('modules').select('*').eq('is_visible', true).order('week', { ascending: true }),
        user
          ? supabase.from('module_progress').select('*').eq('student_nim', user.nim)
          : Promise.resolve({ data: [] }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const mods: Module[] = modsRes.data || [];
      const progressList: ModuleProgress[] = (progressRes.data as ModuleProgress[]) || [];
      const annoList: Announcement[] = annoRes.data || [];

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
      setAnnouncements(annoList);

      // Find resume module
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
    <div className="bg-slate-50 font-[Inter,sans-serif] text-slate-800 min-h-screen pb-28 selection:bg-blue-500/30">
      <div className="max-w-2xl mx-auto relative flex flex-col">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pt-12 pb-6 bg-white sticky top-0 z-40 shadow-sm flex justify-between items-start"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{getGreeting()}</p>
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="RekaFisika Logo" className="w-8 h-8 object-contain" />
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">RekaFisika</h1>
            </div>
            <p className="text-sm text-slate-500">Asisten Belajar Fisika SD, SMP, SMA</p>
          </div>
          <Link to="/profil" className="relative group">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              {user?.profile_photo_url ? (
                <img src={user.profile_photo_url} className="w-full h-full object-cover rounded-full" alt="avatar" />
              ) : initials}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </Link>
        </motion.header>

        {/* ── Resume Learning ── */}
        {resumeModule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="px-6 mb-8 mt-6"
          >
            <Link
              to={`/detail-modul/${resumeModule.id}`}
              className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 text-white shadow-lg shadow-blue-500/30 relative overflow-hidden group hover:scale-[1.02] transition-transform"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 opacity-20 rounded-full blur-xl -ml-5 -mb-5" />

              <div className="relative z-10 flex items-center justify-between mb-2">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold backdrop-blur-sm border border-white/10 shadow-sm">
                  {resumeModule.prog?.is_completed ? 'Review Materi' : 'Lanjutkan Belajar'}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:rotate-45 transition-transform duration-300">
                  <ChevronRight size={14} />
                </div>
              </div>

              <div className="relative z-10 mt-3">
                <h2 className="text-xl font-black mb-1 leading-tight line-clamp-2">{resumeModule.topic}</h2>
                <p className="text-blue-100 text-xs font-medium mb-5">Minggu {resumeModule.week} • Fisika</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-black/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm border border-white/5">
                    <div className="bg-white h-full rounded-full transition-all duration-700" style={{ width: `${resumeModule.percent}%` }} />
                  </div>
                  <span className="text-xs font-bold font-mono">{resumeModule.percent}%</span>
                </div>
              </div>

              <Rocket size={96} className="absolute -bottom-4 -right-4 text-indigo-900 opacity-20 rotate-12 group-hover:translate-x-2 transition-transform duration-500" />
            </Link>
          </motion.div>
        )}

        {/* ── Announcements ── */}
        {announcements.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="px-6 mb-8">
            <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
              <Bell size={18} /> Pengumuman Terbaru
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {announcements.map((n) => {
                const colors: Record<string, string> = {
                  info: 'bg-blue-100 text-blue-600',
                  warning: 'bg-orange-100 text-orange-600',
                  urgent: 'bg-red-100 text-red-600',
                };
                const color = colors[n.type] ?? colors.info;
                return (
                  <div key={n.id} className="min-w-[280px] bg-white p-5 rounded-[2rem] shadow-soft border border-slate-100 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">Admin</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2">{n.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{n.content}</p>
                    </div>
                    <div className={`absolute -right-4 -bottom-4 w-16 h-16 ${color} rounded-full opacity-30`} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Modules List ── */}
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-800">📚 Semua Materi</h3>
            <Link to="/modul" className="text-blue-500 text-sm font-medium">Lihat Semua →</Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white p-5 rounded-2xl h-20" />
              ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
              Belum ada materi tersedia.
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((item, i) => {
                const isCompleted = item.prog?.is_completed;
                const isLocked = item.is_locked;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    {isLocked ? (
                      <div className="flex items-center gap-4 p-4 rounded-2xl border bg-white border-slate-100 shadow-sm opacity-60 cursor-not-allowed">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <Lock size={16} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{item.topic}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Modul ini belum dibuka.</p>
                        </div>
                      </div>
                    ) : (
                      <Link
                        to={`/detail-modul/${item.id}`}
                        className={`group flex items-center gap-4 p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all block ${
                          isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-100' : 'bg-blue-50'
                        }`}>
                          {isCompleted
                            ? <CheckCircle2 size={18} className="text-emerald-500" />
                            : <BookOpen size={18} className="text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors">
                            {item.topic}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {item.description || 'Pelajari materi ini.'}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">{item.percent}%</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
