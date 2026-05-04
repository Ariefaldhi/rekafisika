import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, FileText, Play, Brain, 
  ChevronLeft, ChevronRight, CheckCircle, 
  Hourglass, Loader2, Radio, DoorOpen, X, AlertTriangle, Users, ChevronsLeft
} from 'lucide-react';
import { supabase, type Module } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { marked } from 'marked';

// --- Sub-Components ---

const PDFViewer = ({ url, startPage, endPage }: { url: string; startPage?: number; endPage?: number }) => {
  return (
    <div className="w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 mt-2 relative group isolate min-h-[400px] lg:min-h-[600px] flex flex-col">
      <iframe 
        src={`${url}#page=${startPage || 1}`} 
        className="w-full flex-1 border-none"
        title="PDF Viewer"
      />
      <div className="bg-white border-t border-slate-200 p-3 flex justify-between items-center px-6">
        <p className="text-xs text-slate-400 font-medium">Halaman yang disarankan: <span className="text-slate-800 font-bold">{startPage || 1} - {endPage || 'Akhir'}</span></p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-500 hover:underline">Buka Fullscreen</a>
      </div>
    </div>
  );
};

const VideoViewer = ({ url, startTime, endTime, isTeacher }: { url: string; startTime?: number; endTime?: number; isTeacher: boolean }) => {
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(url);
  
  if (!isTeacher && videoId) {
    return (
      <div className="mt-2 p-10 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center gap-4 min-h-[300px] shadow-sm">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-400 text-3xl shadow-sm mb-2 animate-pulse">
          <Radio size={40} />
        </div>
        <h4 className="text-xl font-black text-slate-800">Perhatikan Layar Guru</h4>
        <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
          Guru sedang memutar video. Silakan perhatikan penjelasan guru di depan kelas.
        </p>
      </div>
    );
  }

  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?start=${startTime || 0}${endTime ? `&end=${endTime}` : ''}&autoplay=0&rel=0`
    : url;

  return (
    <div className="mt-2 relative w-full">
      <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800">
        <iframe 
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Player"
        />
      </div>
    </div>
  );
};

// --- Main Component ---

export default function DetailModul() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const pathId = searchParams.get('path');
  
  const [module, setModule] = useState<Module | null>(null);
  const [pathData, setPathData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [inWaitingRoom, setInWaitingRoom] = useState(true);
  const [isShowingPathReflection, setIsShowingPathReflection] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showLKPD, setShowLKPD] = useState(false);
  
  // Registration State
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState('');
  const [teachingCode, setTeachingCode] = useState('');
  
  // Reflection Answers State
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [pathReflectionAnswers, setPathReflectionAnswers] = useState<Record<number, string>>({});
  const [saveStatus, setSaveStatus] = useState<string>('');

  const channelRef = useRef<any>(null);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchData();
    
    if (user?.teaching_code) setTeachingCode(user.teaching_code);
    
    const sessionKey = pathId ? `rekafisika_path_${pathId}` : `rekafisika_session_${id}`;
    const saved = localStorage.getItem(sessionKey);
    
    if (saved) {
      const parsed = JSON.parse(saved);
      setGroupName(parsed.groupName);
      setMembers(parsed.members);
      setTeachingCode(parsed.teachingCode);

      if (pathId) {
        setupRealtime(parsed.teachingCode);
      }
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pathId, user?.teaching_code]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: modData, error: modError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();
      
      if (modError) throw modError;
      if (modData.is_locked && !isTeacher) {
        alert('Modul ini masih terkunci.');
        navigate('/home');
        return;
      }

      let finalSteps = modData.steps || [];
      let isFirstInPath = true;

      if (pathId) {
        const { data: lpData } = await supabase
          .from('learning_paths')
          .select('*, modules:learning_path_modules(*)')
          .eq('id', pathId)
          .single();
        
        if (lpData) {
          setPathData(lpData);
          finalSteps = finalSteps.filter((s: any) => s.type !== 'refleksi');
          
          const sorted = lpData.modules.sort((a: any, b: any) => a.order_index - b.order_index);
          isFirstInPath = sorted[0]?.module_id === id;
        }
      }
      
      setModule({ ...modData, steps: finalSteps });
      
      if (pathId && !isFirstInPath) {
        setCurrentPage(1);
        setInWaitingRoom(false);
      } else {
        setCurrentPage(0);
      }

      setIsShowingPathReflection(false);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtime = (code: string) => {
    if (channelRef.current) channelRef.current.unsubscribe();

    const channel = supabase.channel(`room_${code}`, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'ping' }, ({ payload }) => {
        if (isTeacher) {
          setJoinedGroups(prev => new Set(prev).add(payload.group));
        }
      })
      .on('broadcast', { event: 'page_sync' }, ({ payload }) => {
        if (!isTeacher) {
          if (payload.moduleId && payload.moduleId !== id) {
            navigate(`/detail-modul/${payload.moduleId}?path=${pathId || ''}`);
            return;
          }
          if (payload.isPathReflection) {
            setIsShowingPathReflection(true);
            setInWaitingRoom(false);
            return;
          }
          setCurrentPage(payload.page);
          if (payload.page > 0) setInWaitingRoom(false);
        }
      })
      .on('broadcast', { event: 'session_ended' }, () => {
        if (!isTeacher) {
          handleFinishModule(true);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSyncing(true);
          if (!isTeacher) {
            const interval = setInterval(() => {
              if (inWaitingRoom) {
                channel.send({
                  type: 'broadcast',
                  event: 'ping',
                  payload: { group: groupName }
                });
              } else {
                clearInterval(interval);
              }
            }, 5000);
          }
        }
      });

    channelRef.current = channel;
  };

  const handleJoin = () => {
    if (!teachingCode || (!isTeacher && (!groupName || !members))) {
      alert('Silakan lengkapi data pendaftaran.');
      return;
    }

    const sessionData = {
      groupName: isTeacher ? 'GURU' : groupName,
      members: isTeacher ? user?.nama : members,
      teachingCode
    };

    const sessionKey = pathId ? `rekafisika_path_${pathId}` : `rekafisika_session_${id}`;
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));

    setupRealtime(teachingCode);
    
    if (isTeacher) {
      updateTeacherState(0, id);
    } else {
      fetchTeacherState(teachingCode);
    }
  };

  const fetchTeacherState = async (code: string) => {
    const { data } = await supabase
      .from('sesi_kelas')
      .select('halaman_aktif, module_id')
      .eq('kode_kelas', code)
      .single();
    
    if (data) {
      if (data.module_id !== id) {
        navigate(`/detail-modul/${data.module_id}?path=${pathId || ''}`);
        return;
      }
      if (data.halaman_aktif > 0) {
        setCurrentPage(data.halaman_aktif);
        setInWaitingRoom(false);
      }
    }
  };

  const updateTeacherState = async (page: number, moduleId?: string, isPathReflection?: boolean) => {
    if (!isTeacher) return;
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'page_sync',
        payload: { page, moduleId: moduleId || id, isPathReflection }
      });
    }

    await supabase.from('sesi_kelas').upsert({
      kode_kelas: teachingCode,
      module_id: moduleId || id,
      halaman_aktif: page,
      updated_at: new Date().toISOString()
    }, { onConflict: 'kode_kelas' });
  };

  const handleNext = () => {
    if (!isTeacher) return;
    const next = currentPage + 1;
    if (next <= (module?.steps.length || 0)) {
      setCurrentPage(next);
      updateTeacherState(next);
    }
  };

  const handlePrev = () => {
    if (!isTeacher) return;
    const prev = currentPage - 1;
    if (prev >= 1) {
      setCurrentPage(prev);
      updateTeacherState(prev);
    }
  };

  const handleStartSession = () => {
    setInWaitingRoom(false);
    setCurrentPage(1);
    updateTeacherState(1);
  };

  const handleFinishModule = async (auto = false) => {
    if (!auto && !window.confirm('Selesaikan modul ini?')) return;

    if (isTeacher) {
      if (pathId && pathData) {
        const sortedModules = pathData.modules.sort((a: any, b: any) => a.order_index - b.order_index);
        const currentIdx = sortedModules.findIndex((pm: any) => pm.module_id === id);
        
        if (currentIdx < sortedModules.length - 1) {
          const nextModuleId = sortedModules[currentIdx + 1].module_id;
          updateTeacherState(1, nextModuleId); 
          navigate(`/detail-modul/${nextModuleId}?path=${pathId}`);
          return;
        } else {
          setIsShowingPathReflection(true);
          updateTeacherState(0, id, true);
          return;
        }
      }

      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'session_ended', payload: {} });
      }
      await supabase.from('sesi_kelas').delete().eq('kode_kelas', teachingCode);
      navigate('/home');
    } else {
      await supabase.from('module_progress').upsert({
        student_nim: user?.nim,
        module_id: id,
        is_completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student_nim, module_id' });

      if (pathId && pathData) {
        const sortedModules = pathData.modules.sort((a: any, b: any) => a.order_index - b.order_index);
        const currentIdx = sortedModules.findIndex((pm: any) => pm.module_id === id);
        
        if (currentIdx < sortedModules.length - 1) {
          const nextModuleId = sortedModules[currentIdx + 1].module_id;
          navigate(`/detail-modul/${nextModuleId}?path=${pathId}`);
          return;
        } else {
          setIsShowingPathReflection(true);
          return;
        }
      }

      alert('Selamat! Anda telah menyelesaikan modul.');
      navigate('/home');
    }
  };

  const saveRefleksi = async (stepIdx: number, stepAnswers: any) => {
    setSaveStatus('Menyimpan...');
    try {
      const { error } = await supabase.from('reflection_answers').upsert({
        student_nim: user?.nim,
        module_id: id,
        step_index: stepIdx,
        teaching_code: teachingCode,
        group_name: groupName,
        answers: stepAnswers,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_nim, module_id, step_index' });

      if (error) throw error;
      setSaveStatus('Tersimpan');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      setSaveStatus('Gagal menyimpan');
    }
  };

  const savePathReflection = async () => {
    setSaveStatus('Menyimpan Refleksi Akhir...');
    try {
      const { error } = await supabase.from('path_reflection_answers').upsert({
        student_nim: user?.nim,
        path_id: pathId,
        teaching_code: teachingCode,
        group_name: groupName,
        answers: pathReflectionAnswers,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_nim, path_id' });

      if (error) throw error;
      setSaveStatus('Selesai!');
      alert('Terima kasih! Seluruh rangkaian ajar telah selesai.');
      navigate('/home');
    } catch (err) {
      alert('Gagal menyimpan refleksi rangkaian.');
    }
  };

  const handleExitWaitingRoom = () => {
    if (channelRef.current) channelRef.current.unsubscribe();
    setIsSyncing(false);
    setShowExitConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Memuat Materi...</p>
      </div>
    );
  }

  if (!module) return <div>Modul tidak ditemukan.</div>;

  if (isShowingPathReflection) {
    return (
      <div className="min-h-screen bg-slate-50 font-[Inter,sans-serif] pb-24">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest">Refleksi Akhir Rangkaian</h1>
          {saveStatus && <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{saveStatus}</span>}
        </header>

        <main className="max-w-3xl mx-auto p-6 mt-8 space-y-10">
           <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Brain size={40} />
             </div>
             <h2 className="text-3xl font-black text-slate-900">Refleksi Pembelajaran</h2>
             <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
               Selamat! Anda telah menyelesaikan seluruh materi dalam rangkaian **{pathData?.title}**. 
               Silakan jawab pertanyaan refleksi berikut untuk mengakhiri sesi.
             </p>
           </div>

           <div className="space-y-6">
              {(pathData?.reflection_questions || []).map((q: string, idx: number) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                   <p className="text-sm font-black text-slate-800">{idx + 1}. {q}</p>
                   <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    rows={4}
                    placeholder="Ketik jawaban kelompok Anda di sini..."
                    value={pathReflectionAnswers[idx] || ''}
                    onChange={e => setPathReflectionAnswers({...pathReflectionAnswers, [idx]: e.target.value})}
                   />
                </div>
              ))}
           </div>

           {!isTeacher ? (
             <button 
              onClick={savePathReflection}
              className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all"
             >
               Kirim Jawaban & Selesai
             </button>
           ) : (
             <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                <p className="text-sm font-bold text-blue-600">Guru sedang menunggu siswa mengisi refleksi.</p>
                <button onClick={() => navigate('/home')} className="mt-4 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline">Selesaikan Sesi Live Sekarang</button>
             </div>
           )}
        </main>
      </div>
    );
  }

  if (currentPage === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-[Inter,sans-serif] pb-24">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">{pathId ? 'Sesi Rangkaian' : 'Sesi Materi'}</p>
              <h1 className="text-sm font-bold text-slate-800 line-clamp-1">{module.topic}</h1>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 mt-12 flex items-center justify-center min-h-[60vh]">
          <div className="max-w-xl w-full space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">{module.topic}</h2>
              <div className="prose prose-slate max-w-none text-slate-500 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(module.description || '') }} />
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-10 bg-white rounded-[3rem] border border-slate-100 space-y-8 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-4 text-blue-600">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <DoorOpen size={24} />
                </div>
                <h4 className="font-black text-xs uppercase tracking-[0.2em]">Pendaftaran Sesi</h4>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-2 tracking-widest">Kode Pengajaran Guru</label>
                  <input 
                    type="text" 
                    value={teachingCode}
                    readOnly={isTeacher}
                    onChange={(e) => !isTeacher && setTeachingCode(e.target.value.toUpperCase())}
                    className={`w-full ${isTeacher ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-blue-500'} border border-slate-100 rounded-2xl px-6 py-4 text-lg font-black outline-none transition-all`} 
                    placeholder="PHYS-2024"
                  />
                </div>
                {!isTeacher && (
                  <>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-2 tracking-widest">Nama Kelompok</label>
                        <input 
                          type="text" 
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                          placeholder="Misal: Kelompok 1 / Newton"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-2 tracking-widest">Anggota Kelompok</label>
                        <textarea 
                          value={members}
                          onChange={(e) => setMembers(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                          rows={2} 
                          placeholder="Nama anggota dipisah koma..."
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={handleJoin} 
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
              >
                {isTeacher ? 'Buka Sesi Kelas' : 'Masuk ke Kelas'}
              </button>
            </motion.div>
          </div>
        </main>

        <AnimatePresence>
          {isSyncing && inWaitingRoom && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-3xl w-full bg-white rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col"
              >
                <button 
                  onClick={() => setShowExitConfirm(true)}
                  className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center z-20"
                >
                  <X size={24} />
                </button>

                <div className="p-12 space-y-10">
                   <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                         <Radio className="animate-pulse" size={40} />
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ruang Tunggu Kelas</h2>
                      <div className="inline-flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KODE AKSES</span>
                        <span className="font-black text-slate-800 tracking-wider">{teachingCode}</span>
                      </div>
                   </div>

                   {isTeacher ? (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Siswa Terhubung ({joinedGroups.size})</h4>
                          {joinedGroups.size > 0 && <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Update</span>}
                       </div>
                       <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 min-h-[250px] max-h-[350px] overflow-y-auto custom-scrollbar">
                         {joinedGroups.size > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {Array.from(joinedGroups).map(grp => (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={grp} 
                                  className="px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all"
                                >
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                    <CheckCircle size={16} />
                                  </div>
                                  <span className="text-sm font-black text-slate-700">{grp}</span>
                                </motion.div>
                              ))}
                            </div>
                         ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10">
                               <Users className="text-slate-200" size={48} />
                               <p className="text-slate-400 text-sm font-medium">Belum ada siswa yang bergabung.<br/>Mintalah siswa memasukkan kode akses di atas.</p>
                            </div>
                         )}
                       </div>
                       <button onClick={handleStartSession} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all">Mulai Sesi Pembelajaran</button>
                    </div>
                   ) : (
                    <div className="text-center py-12 space-y-8">
                       <div className="relative">
                          <Hourglass className="text-blue-400 animate-spin mx-auto opacity-20" size={100} />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Hourglass className="text-blue-500 animate-pulse" size={48} />
                          </div>
                       </div>
                       <div className="space-y-2">
                         <h3 className="text-2xl font-black text-slate-800">Menunggu Guru...</h3>
                         <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">Pendaftaran Anda berhasil! Silakan perhatikan instruksi guru di depan kelas untuk memulai materi.</p>
                       </div>
                    </div>
                   )}
                </div>
              </motion.div>

              <AnimatePresence>
                {showExitConfirm && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-8"
                    >
                      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertTriangle size={32} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black text-slate-800">Keluar Ruang Tunggu?</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">Koneksi ke sesi kelas akan terputus. Anda harus mendaftar ulang untuk bergabung kembali.</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">Batal</button>
                        <button onClick={handleExitWaitingRoom} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-500/20 transition-all">Keluar Sesi</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const currentStep = module.steps[currentPage - 1];

  return (
    <div className={`min-h-screen bg-slate-50 font-[Inter,sans-serif] flex flex-col pb-32 overflow-hidden relative transition-all duration-300 ${showLKPD ? 'lkpd-open' : ''}`}>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">{pathId ? 'Rangkaian Ajar' : 'Materi Tunggal'}</p>
            <h1 className="text-sm font-bold text-slate-800 line-clamp-1">{module.topic}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {saveStatus && <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{saveStatus}</span>}
          {currentStep?.type === 'phet' && module.lkpd_url && (
            <button 
              onClick={() => setShowLKPD(!showLKPD)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-sm ${
                showLKPD ? 'bg-slate-900 text-white shadow-slate-500/20' : 'bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-100'
              }`}
            >
              {showLKPD ? <ChevronsLeft className="rotate-180" size={14} /> : <FileText size={14} />} 
              {showLKPD ? 'Tutup LKPD' : 'Buka LKPD'}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden h-full">
        {/* LKPD Sidebar - Exact replica of legacy behavior */}
        <aside 
          className={`fixed top-[73px] left-0 bottom-0 w-full lg:w-[28rem] bg-white border-r border-slate-200 shadow-2xl overflow-hidden flex flex-col z-[45] transition-transform duration-300 ease-out ${showLKPD ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-6 border-b flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lembar Kerja</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siswa (LKPD)</p>
              </div>
            </div>
            <button onClick={() => setShowLKPD(false)} className="w-10 h-10 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 bg-slate-100">
            {module.lkpd_url && (
              <iframe 
                src={module.lkpd_url} 
                className="w-full h-full border-none"
                title="LKPD Viewer"
              />
            )}
          </div>
        </aside>

        {/* Main Content - Pushed using margin exactly like legacy */}
        <main 
          id="page-container"
          className={`flex-1 px-4 py-6 relative overflow-hidden transition-all duration-300 ease-out ${showLKPD ? 'lg:ml-[28rem] lg:w-[calc(100%-28rem)]' : 'ml-0 w-full'}`}
        >
          <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <span className={`w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 font-bold flex items-center justify-center text-xl`}>
                    {currentStep.type === 'video' ? <Play /> : (currentStep.type === 'refleksi' ? <Brain /> : <FileText />)}
                  </span>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 leading-tight">{currentStep.title}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{currentStep.type}</span>
                  </div>
                </div>

                {currentStep.instruction && (
                  <div className="bg-blue-50 text-blue-900 text-sm p-5 rounded-2xl border-l-4 border-blue-500">
                    <p className="leading-relaxed font-medium">{currentStep.instruction}</p>
                  </div>
                )}

                <div className="immersive-content flex-1 flex flex-col min-h-0">
                  {(currentStep.type === 'pdf' || currentStep.type === 'ppt') && (
                    <PDFViewer url={currentStep.url} startPage={currentStep.start_page} endPage={currentStep.end_page} />
                  )}
                  {currentStep.type === 'video' && <VideoViewer url={currentStep.url} startTime={currentStep.start_time} endTime={currentStep.end_time} isTeacher={isTeacher} />}
                  {currentStep.type === 'phet' && (
                    <div className="w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex-1 min-h-[500px]">
                      <iframe src={currentStep.url} className="w-full h-full" allowFullScreen />
                    </div>
                  )}
                  {currentStep.type === 'refleksi' && (
                    <div className="space-y-6 pb-24">
                      {(currentStep.questions || []).map((q, qIdx) => (
                        <div key={qIdx} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                          <p className="text-sm font-bold text-slate-700">{qIdx + 1}. {q}</p>
                          <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={answers[currentPage]?.[qIdx] || ''} onChange={(e) => setAnswers({ ...answers, [currentPage]: { ...answers[currentPage], [qIdx]: e.target.value } })} onBlur={() => saveRefleksi(currentPage, answers[currentPage])} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer Navigation */}
      <div id="step-nav-container" className="fixed bottom-0 left-0 w-full px-6 pb-6 pt-10 pointer-events-none z-50">
        <div className={`max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200 p-4 shadow-2xl rounded-3xl pointer-events-auto flex items-center justify-between gap-4 transition-all duration-300 ${showLKPD ? 'lg:translate-x-[14rem]' : ''}`}>
          <button onClick={handlePrev} disabled={!isTeacher || currentPage <= 1} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold bg-slate-100 text-slate-500 disabled:opacity-30">
            <ChevronLeft size={20} /> <span className="hidden sm:inline">Sebelumnya</span>
          </button>
          
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-slate-700">{currentPage} / {module.steps.length}</p>
            {!isTeacher && <div className="text-[9px] text-blue-500 font-bold uppercase animate-pulse mt-1">Layar Terkendali Guru</div>}
          </div>

          <button onClick={currentPage === module.steps.length ? () => handleFinishModule() : handleNext} disabled={!isTeacher} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white shadow-lg ${currentPage === module.steps.length ? 'bg-emerald-500' : 'bg-blue-600'} disabled:opacity-50`}>
            <span>{currentPage === module.steps.length ? (pathId ? 'Lanjut Rangkaian' : 'Selesai') : 'Selanjutnya'}</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
