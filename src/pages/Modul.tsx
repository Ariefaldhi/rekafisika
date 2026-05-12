import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Lock, ChevronRight, Zap,
  GraduationCap, Search, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Module } from '../lib/supabase';

interface GroupedByKategori {
  kategori: string;
  modules: Module[];
}

interface GroupedByKelas {
  kelas: string;
  kategoris: GroupedByKategori[];
  total: number;
}

export default function Modul() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedKategori, setSelectedKategori] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const mods = data || [];
      setModules(mods);
      // Default ke kelas pertama
      const first = [...new Set(mods.map((m) => m.kelas).filter(Boolean))][0] as string;
      if (first) setSelectedKelas(first);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Derived data ──
  const kelasList = [...new Set(modules.map((m) => m.kelas).filter(Boolean))] as string[];

  const searchFiltered = searchQuery.trim()
    ? modules.filter(
        (m) =>
          m.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : modules.filter((m) => !selectedKelas || m.kelas === selectedKelas);

  const kategorisInKelas = [
    ...new Set(searchFiltered.map((m) => m.kategori || 'Lainnya')),
  ];

  const grouped: GroupedByKategori[] = kategorisInKelas
    .filter((k) => !selectedKategori || k === selectedKategori)
    .map((kat) => ({
      kategori: kat,
      modules: searchFiltered.filter((m) => (m.kategori || 'Lainnya') === kat),
    }));

  // Summary per kelas for the selector
  const kelasSummary: GroupedByKelas[] = kelasList.map((kelas) => {
    const kMods = modules.filter((m) => m.kelas === kelas);
    const kKats = [...new Set(kMods.map((m) => m.kategori || 'Lainnya'))];
    return {
      kelas,
      total: kMods.length,
      kategoris: kKats.map((k) => ({
        kategori: k,
        modules: kMods.filter((m) => (m.kategori || 'Lainnya') === k),
      })),
    };
  });

  const totalShown = grouped.reduce((s, g) => s + g.modules.length, 0);

  return (
    <div className="w-full pb-28 font-[Inter,sans-serif]">

      {/* ══ HEADER BANNER ══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-500 px-6 lg:px-12 pt-8 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-2xl" />
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 64" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64 L0,32 Q360,64 720,32 Q1080,0 1440,32 L1440,64 Z" fill="#f8fafc" />
          </svg>
        </div>
        <div className="relative z-10 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-blue-200 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
              Kurikulum Merdeka
            </p>
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Jelajah Materi Fisika
            </h1>
            <p className="text-blue-100/80 text-sm lg:text-base max-w-lg">
              Temukan modul interaktif yang terorganisir per kelas dan kategori. Pilih topik yang ingin Anda ajarkan.
            </p>
            {/* Search Bar */}
            <div className="mt-6 relative max-w-md">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Cari modul fisika..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedKategori(null); }}
                className="w-full bg-white/15 border border-white/20 text-white placeholder-white/40 rounded-2xl pl-12 pr-12 py-3.5 text-sm font-medium outline-none focus:bg-white/20 focus:border-white/40 transition-all backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 lg:px-12 -mt-4">

        {/* ══ FILTER BAR ══ */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-5 lg:p-7 mb-10"
          >
            {/* Kelas selector tabs */}
            <div className="mb-5 pb-5 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <GraduationCap size={12} /> Pilih Kelas
              </p>
              <div className="flex gap-2 flex-wrap">
                {kelasSummary.map((k) => (
                  <button
                    key={k.kelas}
                    onClick={() => { setSelectedKelas(k.kelas); setSelectedKategori(null); }}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-black transition-all duration-200 ${
                      selectedKelas === k.kelas
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {k.kelas}
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        selectedKelas === k.kelas ? 'bg-white/20 text-white' : 'bg-white text-slate-400'
                      }`}
                    >
                      {k.total}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kategori pills */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen size={12} /> Filter Kategori
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setSelectedKategori(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    !selectedKategori
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                {kategorisInKelas.map((kat) => (
                  <button
                    key={kat}
                    onClick={() => setSelectedKategori(kat === selectedKategori ? null : kat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      selectedKategori === kat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {kat}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search result label */}
        {searchQuery && (
          <div className="mb-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {totalShown} hasil untuk "{searchQuery}"
            </p>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
        )}

        {/* ══ CONTENT ══ */}
        {isLoading ? (
          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-slate-200 rounded-full" />
                  <div className="h-6 w-40 bg-slate-200 rounded-xl animate-pulse" />
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
          <div className="text-center py-28">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-9 h-9 text-blue-300" />
            </div>
            <h3 className="text-xl font-black text-slate-400 mb-2">Tidak ditemukan</h3>
            <p className="text-slate-400 text-sm font-medium">Coba kata kunci atau kelas yang berbeda.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {grouped.map((group, gIdx) => (
              <motion.section
                key={group.kategori}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + gIdx * 0.07, duration: 0.4 }}
                className="space-y-5"
              >
                {/* Kategori heading */}
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-9 bg-gradient-to-b from-indigo-600 to-blue-500 rounded-full" />
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {group.kategori}
                    </h2>
                    {!searchQuery && selectedKelas && (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        {selectedKelas}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-slate-100 ml-1" />
                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                    {group.modules.length} Modul
                  </span>
                </div>

                {/* Module cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {group.modules.map((item, mIdx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + gIdx * 0.06 + mIdx * 0.04 }}
                    >
                      <Link
                        to={`/detail-modul/${item.id}`}
                        className={`group block h-full bg-white p-6 rounded-[2.5rem] border-2 flex flex-col transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 ${
                          item.is_locked
                            ? 'opacity-60 grayscale cursor-not-allowed border-slate-100'
                            : 'border-transparent hover:border-indigo-200'
                        }`}
                      >
                        {/* Icon row */}
                        <div className="flex items-start justify-between mb-5">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
                              item.is_locked ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-500'
                            }`}
                          >
                            {item.is_locked ? <Lock size={20} /> : <BookOpen size={20} />}
                          </div>
                          {item.kelas && searchQuery && (
                            <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                              {item.kelas}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="font-black text-slate-900 text-base leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {item.topic}
                          </h3>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-3">
                            {item.description || 'Pelajari konsep dasar dan penerapan praktis dari topik ini.'}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Zap size={11} className="text-slate-300" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                              {item.steps?.length || 0} Langkah
                            </span>
                          </div>
                          {!item.is_locked && (
                            <div className="flex items-center gap-1 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all">
                              <span className="text-[9px] font-black uppercase tracking-widest">Buka</span>
                              <ChevronRight size={13} />
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}

            {/* Bottom padding label */}
            <div className="text-center pt-8 pb-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                Total {totalShown} Modul · {grouped.length} Kategori
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
