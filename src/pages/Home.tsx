import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Lock, ChevronRight,
  Route, ChevronDown, Star, Zap, GraduationCap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Module, LearningPath } from '../lib/supabase';
import logoUrl from '/logo.png';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

interface ModuleWithProgress extends Module {}

interface GroupedContent {
  kategori: string;
  modules: ModuleWithProgress[];
  paths: LearningPath[];
}

export default function Home() {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kelasDipilihCount, setKelasDipilihCount] = useState(0);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedKategori, setSelectedKategori] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setIsLoading(true);
    try {
      const [modsRes, pathsRes] = await Promise.all([
        supabase.from('modules').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
        supabase
          .from('learning_paths')
          .select('*, learning_path_modules(module_id, order_index)')
          .eq('is_visible', true),
      ]);

      const mods: Module[] = modsRes.data || [];
      const pathList: LearningPath[] = pathsRes.data || [];
      const enriched: ModuleWithProgress[] = mods.map((m) => ({ ...m }));

      setModules(enriched);
      setPaths(pathList);

      // Hitung jumlah kategori unik
      const uniqueKategoris = new Set(mods.map((m) => m.kategori).filter(Boolean));
      setKelasDipilihCount(uniqueKategoris.size);

      // Default kelas → first unique value found
      const kelasList = [...new Set(enriched.map((m) => m.kelas).filter(Boolean))] as string[];
      if (kelasList.length > 0) setSelectedKelas(kelasList[0]);

      // Check for active teacher session
      if (user?.teaching_code && (user.role === 'teacher' || user.role === 'admin')) {
        const { data: session } = await supabase
          .from('sesi_kelas')
          .select('*, modules(topic)')
          .eq('kode_kelas', user.teaching_code.trim().toUpperCase())
          .maybeSingle();
        if (session) setActiveSession(session);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ── Derived data ──
  const kelasList = [...new Set(modules.map((m) => m.kelas).filter(Boolean))] as string[];

  const filteredModules = modules.filter((m) => !selectedKelas || m.kelas === selectedKelas);

  const allKategoris = [...new Set(filteredModules.map((m) => m.kategori || 'Lainnya'))];

  const grouped: GroupedContent[] = allKategoris
    .filter((kat) => !selectedKategori || kat === selectedKategori)
    .map((kat) => ({
      kategori: kat,
      modules: filteredModules.filter((m) => (m.kategori || 'Lainnya') === kat),
      paths: paths.filter((p) => {
        const ids = ((p as any).learning_path_modules || []).map((lpm: any) => lpm.module_id) as string[];
        return ids.some((id) => filteredModules.find((m) => m.id === id && (m.kategori || 'Lainnya') === kat));
      }),
    }));

  const initials = user?.nama
    ? user.nama.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'G';

  return (
    <div className="bg-slate-50 font-[Inter,sans-serif] min-h-screen w-full pb-28">

      {/* ══════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-20 w-72 h-72 bg-indigo-900/30 rounded-full blur-2xl" />
          <div className="absolute top-10 left-1/2 w-96 h-40 bg-blue-500/20 rounded-full blur-3xl" />
          {/* Wave at bottom */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 72" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,72 L0,36 Q360,72 720,36 Q1080,0 1440,36 L1440,72 Z" fill="#f8fafc" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-20">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl} alt="RekaFisika" className="w-9 h-9 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3242/3242120.png'; }}
              />
              <span className="text-lg font-black text-white tracking-tight">RekaFisika</span>
            </div>
            <Link
              to="/profil"
              className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center font-bold text-sm backdrop-blur-sm"
            >
              {initials}
            </Link>
          </div>

          {/* Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-10"
          >
            {/* Left: greeting */}
            <div className="space-y-4 max-w-xl">
              <p className="text-blue-200 font-bold text-sm uppercase tracking-widest">
                {getGreeting()} 👋
              </p>
              <h1 className="text-3xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">
                Halo,{' '}
                <span className="text-blue-200">
                  {user?.nama?.split(' ')[0] || 'Pengajar'}!
                </span>
                <br />
                <span className="text-white/90 text-2xl lg:text-3xl font-bold">Siap mengajar hari ini?</span>
              </h1>
              <p className="text-blue-100/70 text-sm lg:text-base leading-relaxed">
                Kelola materi, rangkaian ajar, dan sesi kelas interaktif Anda di sini.
              </p>
            </div>

            {/* Right: stat pills */}
            <div className="flex gap-3 lg:gap-4 flex-wrap lg:flex-nowrap">
              {[
                { value: modules.length, label: 'Modul', icon: <BookOpen size={16} /> },
                { value: paths.length, label: 'Rangkaian', icon: <Route size={16} /> },
                { value: kelasDipilihCount, label: 'Kategori', icon: <GraduationCap size={16} /> },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center bg-white/10 backdrop-blur-sm border border-white/15 rounded-3xl px-7 py-5 text-white min-w-[90px]"
                >
                  <div className="text-blue-300 mb-1">{stat.icon}</div>
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active Session Recovery Banner */}
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <span className="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                  <span className="w-3 h-3 bg-emerald-400 rounded-full flex" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Sesi Sedang Berjalan</p>
                  <p className="text-white font-black text-base">{activeSession.modules?.topic || 'Materi Aktif'}</p>
                </div>
              </div>
              <Link
                to={`/detail-modul/${activeSession.module_id}${activeSession.path_id ? `?path=${activeSession.path_id}` : ''}&resume=true`}
                className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2 whitespace-nowrap shadow-lg"
              >
                Lanjutkan Mengajar <ChevronRight size={14} />
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FILTER BAR (Kelas + Kategori)
      ══════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative -mt-5 bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-6 lg:p-8 mb-10"
        >
          {/* Kelas selector row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Star size={18} className="text-yellow-500 fill-yellow-400" />
              <span className="font-black text-slate-800 text-base">Materi populer untuk</span>
            </div>
            <div className="relative">
              <select
                value={selectedKelas}
                onChange={(e) => { setSelectedKelas(e.target.value); setSelectedKategori(null); }}
                className="appearance-none bg-blue-50 border border-blue-100 text-blue-700 font-black text-sm rounded-2xl pl-5 pr-10 py-3 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <option value="">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
            </div>
            {selectedKelas && (
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-auto hidden sm:block">
                {filteredModules.length} modul tersedia
              </span>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setSelectedKategori(null)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                !selectedKategori
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Semua Topik
            </button>
            {allKategoris.map((kat) => (
              <button
                key={kat}
                onClick={() => setSelectedKategori(kat === selectedKategori ? null : kat)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                  selectedKategori === kat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {kat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            GROUPED CONTENT
        ══════════════════════════════════════════ */}
        {isLoading ? (
          <div className="space-y-16">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-1 h-8 bg-slate-200 rounded-full" />
                  <div className="h-7 w-52 bg-slate-200 rounded-2xl animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-44 bg-slate-200 rounded-[2.5rem] animate-pulse" />
                  ))}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-44 bg-white rounded-[2rem] animate-pulse border border-slate-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-xl font-black text-slate-400 mb-2">Belum ada materi</h3>
            <p className="text-slate-400 font-medium text-sm">
              Belum ada modul untuk kelas ini. Silakan pilih kelas lain.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {grouped.map((group, gIdx) => (
              <motion.section
                key={group.kategori}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + gIdx * 0.07, duration: 0.5 }}
                className="space-y-8"
              >
                {/* ── Kategori header ── */}
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-10 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none">
                      {group.kategori}
                    </h2>
                    {selectedKelas && (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {selectedKelas}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-slate-100 ml-2" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                    {group.modules.length} Modul · {group.paths.length} Rangkaian
                  </span>
                </div>

                {/* ── Rangkaian Ajar ── */}
                {group.paths.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Route size={14} className="text-purple-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Rangkaian Ajar
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {group.paths.map((path, pIdx) => {
                        const sortedPathMods = ((path as any).learning_path_modules || [])
                          .sort((a: any, b: any) => a.order_index - b.order_index);
                        const firstModuleId = sortedPathMods[0]?.module_id;
                        return (
                          <motion.div
                            key={path.id}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + gIdx * 0.07 + pIdx * 0.05 }}
                          >
                            <Link
                              to={`/detail-modul/${firstModuleId}?path=${path.id}`}
                              className="group block relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-[2.5rem] text-white overflow-hidden hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 shadow-2xl shadow-slate-900/25"
                            >
                              {/* Decorative glow */}
                              <div className="absolute top-0 right-0 w-60 h-60 bg-purple-600/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-purple-600/25 transition-colors" />
                              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                  <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                                    <Route size={24} className="text-purple-400" />
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="text-[9px] font-black text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                      Rangkaian Ajar
                                    </span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                      {sortedPathMods.length} Materi
                                    </span>
                                  </div>
                                </div>

                                <h3 className="text-xl lg:text-2xl font-black text-white mb-3 leading-tight tracking-tight">
                                  {path.title}
                                </h3>
                                <p className="text-slate-400 text-sm font-medium line-clamp-2 mb-8 leading-relaxed">
                                  {path.description || 'Alur pembelajaran terstruktur untuk penguasaan materi yang mendalam.'}
                                </p>

                                {/* Module chain preview */}
                                <div className="flex items-center gap-2 mb-6">
                                  {sortedPathMods.slice(0, 4).map((_: any, i: number) => (
                                    <div
                                      key={i}
                                      className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[9px] font-black text-slate-400"
                                    >
                                      {i + 1}
                                    </div>
                                  ))}
                                  {sortedPathMods.length > 4 && (
                                    <span className="text-[9px] font-black text-slate-500 ml-1">
                                      +{sortedPathMods.length - 4} lagi
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                                  Mulai Rangkaian <ChevronRight size={14} />
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Modul Grid ── */}
                {group.modules.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <BookOpen size={14} className="text-blue-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Modul Mandiri
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {group.modules.map((item, mIdx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + gIdx * 0.07 + mIdx * 0.04 }}
                        >
                          <Link
                            to={`/detail-modul/${item.id}`}
                            className={`group block h-full bg-white p-6 rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 flex flex-col ${
                              item.is_locked
                                ? 'opacity-60 grayscale cursor-not-allowed border-slate-100'
                                : 'border-transparent hover:border-blue-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-5">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
                                  item.is_locked ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-500'
                                }`}
                              >
                                {item.is_locked ? <Lock size={20} /> : <BookOpen size={22} />}
                              </div>
                            </div>

                            <div className="flex-1">
                              <h4 className="font-black text-slate-900 text-base leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                {item.topic}
                              </h4>
                              <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-3">
                                {item.description || 'Pelajari konsep melalui simulasi interaktif.'}
                              </p>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Zap size={11} className="text-slate-300" />
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                  {item.steps?.length || 0} Langkah
                                </span>
                              </div>
                              <ChevronRight
                                size={16}
                                className="text-slate-200 group-hover:text-blue-500 transition-colors"
                              />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.section>
            ))}
          </div>
        )}

        <div className="text-center py-16">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
            RekaFisika • Digital Learning Ecosystem
          </p>
        </div>
      </div>
    </div>
  );
}
