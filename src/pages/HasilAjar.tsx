import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Users, Calendar, 
  ChevronRight, BookOpen, 
  CheckCircle2, Loader2, Table as TableIcon,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ResultEntry {
  id: string;
  student_nim: string;
  module_id: string;
  step_index: number;
  group_name: string;
  teaching_code: string;
  answers: any;
  created_at: string;
  updated_at: string;
  module_topic?: string;
  module_steps?: any[];
}

export default function HasilAjar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [filteredResults, setFilteredResults] = useState<ResultEntry[]>([]);
  
  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  // Detail Modal
  const [selectedResult, setSelectedResult] = useState<ResultEntry | null>(null);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchResults = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch reflection answers for this teacher's code
      let query = supabase
        .from('reflection_answers')
        .select(`
          *,
          modules (topic, steps)
        `)
        .order('created_at', { ascending: false });

      if (user.role !== 'admin') {
        query = query.eq('teaching_code', user.teaching_code);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        ...item,
        module_topic: item.modules?.topic,
        module_steps: item.modules?.steps
      }));

      setResults(formattedData);
      setFilteredResults(formattedData);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = results;

    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.group_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.module_topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedModule !== 'all') {
      filtered = filtered.filter(r => r.module_id === selectedModule);
    }

    if (selectedGroup !== 'all') {
      filtered = filtered.filter(r => r.group_name === selectedGroup);
    }

    setFilteredResults(filtered);
  }, [searchQuery, selectedModule, selectedGroup, results]);

  const uniqueModules = Array.from(new Set(results.map(r => JSON.stringify({ id: r.module_id, topic: r.module_topic }))))
    .map(s => JSON.parse(s));
  
  const uniqueGroups = Array.from(new Set(results.map(r => r.group_name)));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-[Inter,sans-serif] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/lainnya')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Hasil Ajar Digital</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Pantau kemajuan isian siswa secara realtime</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">LIVE DATA ACTIVE</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-12 space-y-8">
        {/* Filter Bar */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari kelompok atau materi..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <select 
              value={selectedModule} 
              onChange={e => setSelectedModule(e.target.value)}
              className="flex-1 md:w-48 bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none appearance-none"
             >
                <option value="all">SEMUA MATERI</option>
                {uniqueModules.map(m => (
                  <option key={m.id} value={m.id}>{m.topic?.toUpperCase()}</option>
                ))}
             </select>
             <select 
              value={selectedGroup} 
              onChange={e => setSelectedGroup(e.target.value)}
              className="flex-1 md:w-48 bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none appearance-none"
             >
                <option value="all">SEMUA KELOMPOK</option>
                {uniqueGroups.map(g => (
                  <option key={g} value={g}>{g?.toUpperCase()}</option>
                ))}
             </select>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((res) => (
            <motion.div 
              key={res.id}
              layoutId={res.id}
              onClick={() => setSelectedResult(res)}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
            >
               <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <BookOpen size={24} />
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Halaman</p>
                   <p className="text-lg font-black text-slate-800">{res.step_index}</p>
                 </div>
               </div>

               <h3 className="text-lg font-black text-slate-900 mb-1 line-clamp-1">{res.module_topic}</h3>
               <div className="flex items-center gap-2 mb-6">
                 <Users size={14} className="text-slate-400" />
                 <span className="text-sm font-bold text-slate-500">{res.group_name}</span>
               </div>

               <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 size={12} />
                    <span>Lengkap</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-2">
                    <Calendar size={12} />
                    {new Date(res.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
               </div>
            </motion.div>
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-20">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
               <Search size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-400">Tidak ada hasil yang ditemukan</h3>
             <p className="text-slate-400 text-sm mt-2">Coba sesuaikan filter atau kata kunci Anda.</p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                     <Users size={28} />
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedResult.group_name}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Materi: {selectedResult.module_topic} • Halaman: {selectedResult.step_index}
                     </p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => window.print()}
                    className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all"
                   >
                     <Download size={20} />
                   </button>
                   <button 
                    onClick={() => setSelectedResult(null)}
                    className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
                   >
                     <ChevronRight size={24} className="rotate-90" />
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar print:p-0">
                {/* Answers Content - Reusing DetailModul Layout */}
                <div className="space-y-10">
                  {/* Kegiatan Mapping */}
                  {selectedResult.module_steps?.[selectedResult.step_index - 1]?.kegiatan?.map((keg: any, kIdx: number) => (
                    <div key={kIdx} className="space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-blue-500/20">
                             {kIdx + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">{keg.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data & Observasi Kelompok</p>
                          </div>
                       </div>

                       {/* Questions */}
                       {keg.questions?.length > 0 && (
                         <div className="space-y-5 pl-4 border-l-2 border-slate-100">
                            {keg.questions.map((q: string, qIdx: number) => (
                              <div key={qIdx} className="bg-slate-50 p-6 rounded-3xl border border-slate-200/50 shadow-sm space-y-4">
                                <p className="text-sm font-bold text-slate-700 leading-relaxed">{qIdx + 1}. {q}</p>
                                <div className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-600 shadow-sm min-h-[60px]">
                                   {selectedResult.answers?.kegiatan?.[kIdx]?.questions?.[qIdx] || <em className="text-slate-300 font-normal">Siswa tidak mengisi jawaban.</em>}
                                </div>
                              </div>
                            ))}
                         </div>
                       )}

                       {/* Tables */}
                       {keg.tables?.length > 0 && (
                         <div className="space-y-6 pl-4 border-l-2 border-slate-100">
                            {keg.tables.map((table: any, tIdx: number) => (
                              <div key={tIdx} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                 <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/70">{table.title || `Tabel Pengamatan`}</h5>
                                    <TableIcon size={14} className="text-emerald-400" />
                                 </div>
                                 <div className="overflow-x-auto">
                                   <table className="w-full text-xs">
                                     <thead className="bg-slate-100 text-slate-600 border-b">
                                       <tr>
                                         <th className="px-4 py-3 border-r text-center w-12">No</th>
                                         {table.columns.map((col: string, cIdx: number) => (
                                           <th key={cIdx} className="px-4 py-3 border-r text-left font-black uppercase tracking-tighter">{col}</th>
                                         ))}
                                       </tr>
                                     </thead>
                                     <tbody>
                                       {Array.from({ length: table.rows || 1 }).map((_, rIdx) => (
                                         <tr key={rIdx} className="border-b border-slate-50 last:border-0">
                                           <td className="px-4 py-3 border-r bg-slate-50/50 text-center font-bold text-slate-400">{rIdx + 1}</td>
                                           {table.columns.map((_: string, cIdx: number) => (
                                             <td key={cIdx} className="px-4 py-3 border-r font-medium text-slate-600">
                                                {selectedResult.answers?.kegiatan?.[kIdx]?.tables?.[tIdx]?.[rIdx]?.[cIdx] || <span className="text-slate-200">—</span>}
                                             </td>
                                           ))}
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  ))}

                  {/* Legacy Reflections support */}
                  {!selectedResult.module_steps?.[selectedResult.step_index - 1]?.kegiatan && selectedResult.answers?.reflections && (
                    <div className="space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg">R</div>
                          <h3 className="text-lg font-black text-slate-800">Refleksi Mandiri</h3>
                       </div>
                       {selectedResult.answers.reflections.map((ans: string, idx: number) => (
                         <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                            <p className="text-sm font-bold text-slate-700">Pertanyaan {idx + 1}</p>
                            <div className="p-4 bg-white border rounded-2xl text-sm font-medium text-slate-600 min-h-[100px]">
                              {ans || <em className="text-slate-300">Kosong</em>}
                            </div>
                         </div>
                       ))}
                    </div>
                  )}

                  {/* If nothing in kegiatan or reflections */}
                  {(!selectedResult.module_steps?.[selectedResult.step_index - 1]?.kegiatan) && (!selectedResult.answers?.reflections) && (
                    <div className="text-center py-10">
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Data input tidak ditemukan untuk halaman ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
