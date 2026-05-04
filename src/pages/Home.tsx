import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Lock, ChevronRight, Bell, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
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
    <div className="w-full px-6 lg:px-12 py-8 relative flex flex-col gap-8">
      {/* ── Header (Mobile only, Desktop uses Sidebar) ── */}
      <header className="lg:hidden flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{getGreeting()}</p>
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">RekaFisika</h1>
          </div>
        </div>
        <Link to="/profil" className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg">
          {initials}
        </Link>
      </header>

      {/* ── Desktop Greeting ── */}
      <div className="hidden lg:block">
        <h2 className="text-3xl font-black text-slate-900">{getGreeting()}, {user?.nama?.split(' ')[0] || 'Teman Belajar'}!</h2>
        <p className="text-slate-500 mt-1">Siap untuk melanjutkan petualangan fisika hari ini?</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focus area */}
        <div className="lg:col-span-7 space-y-8">
          {/* Resume Card */}
          {resumeModule && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                to={`/detail-modul/${resumeModule.id}`}
                className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group hover:scale-[1.01] transition-all"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                    {resumeModule.prog?.is_completed ? 'Review Materi' : 'Lanjutkan Belajar'}
                  </span>
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-black mb-2 leading-tight">{resumeModule.topic}</h2>
                  <p className="text-blue-100 text-sm font-medium mb-8">Minggu {resumeModule.week} • Fisika Terapan</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-black/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                      <div className="bg-white h-full rounded-full transition-all duration-700" style={{ width: `${resumeModule.percent}%` }} />
                    </div>
                    <span className="text-sm font-black font-mono">{resumeModule.percent}%</span>
                  </div>
                </div>
                <Rocket size={120} className="absolute -bottom-6 -right-6 text-indigo-900 opacity-20 rotate-12 group-hover:translate-x-2 transition-transform duration-700" />
              </Link>
            </motion.div>
          )}

          {/* Announcements (Desktop Grid or Mobile List) */}
          <div className="space-y-4">
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
              <Bell size={24} className="text-primary-500" /> Pengumuman
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {announcements.map((n) => (
                <div key={n.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-primary-200 transition-colors">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">
                    {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  <h4 className="font-bold text-slate-800 mb-2 leading-tight">{n.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Modules list */}
        <div className="lg:col-span-5 space-y-6 bg-white/50 backdrop-blur-sm p-6 lg:p-8 rounded-[2.5rem] border border-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl text-slate-800">Daftar Modul</h3>
            <Link to="/modul" className="text-primary-500 text-xs font-black uppercase tracking-widest hover:underline">Jelajah Semua</Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3, 4].map((_) => <div key={_} className="animate-pulse bg-slate-200 p-6 rounded-2xl h-16" />)
            ) : modules.map((item) => (
              <Link
                key={item.id}
                to={`/detail-modul/${item.id}`}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  item.is_locked ? 'opacity-50 grayscale cursor-not-allowed' : 'bg-white hover:border-primary-500 hover:shadow-lg'
                } ${item.prog?.is_completed ? 'bg-emerald-50/50 border-emerald-100' : 'border-slate-100'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.prog?.is_completed ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-500'
                }`}>
                  {item.is_locked ? <Lock size={16} /> : (item.prog?.is_completed ? <CheckCircle2 size={18} /> : <BookOpen size={18} />)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{item.topic}</h4>
                  <div className="mt-1.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${item.prog?.is_completed ? 'bg-emerald-500' : 'bg-primary-500'}`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
