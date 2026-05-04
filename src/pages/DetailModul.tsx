import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, FileText, Play, FlaskConical, Brain, Link as LinkIcon, 
  ChevronLeft, ChevronRight, CheckCircle, Users, Hourglass, 
  MessageSquare, Loader2, Info, Layout, DoorOpen, Radio, ShieldCheck
} from 'lucide-react';
import { supabase, type Module, type ModuleStep } from '../lib/supabase';
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
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-500 hover:underline">Buka Fullscreen</a>
      </div>
    </div>
  );
};

const VideoViewer = ({ url, startTime, endTime, isTeacher }: { url: string; startTime?: number; endTime?: number; isTeacher: boolean }) => {
  // Extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(url);
  
  if (!isTeacher && videoId) {
    return (
      <div className="mt-2 p-10 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center gap-4 min-h-[300px] shadow-sm">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary-400 text-3xl shadow-sm mb-2 animate-pulse">
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
      {endTime && (
        <p className="text-[10px] text-slate-400 mt-3 text-center font-bold tracking-widest uppercase">
          ⏱ Durasi Rekomendasi: {Math.floor((startTime || 0)/60)}:{((startTime||0)%60).toString().padStart(2,'0')} — {Math.floor(endTime/60)}:{(endTime%60).toString().padStart(2,'0')}
        </p>
      )}
    </div>
  );
};

// --- Main Component ---

export default function DetailModul() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [module, setModule] = useState<Module | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [inWaitingRoom, setInWaitingRoom] = useState(true);
  
  // Registration State
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState('');
  const [teachingCode, setTeachingCode] = useState('');
  
  // Reflection Answers State
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [saveStatus, setSaveStatus] = useState<string>('');

  const channelRef = useRef<any>(null);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchModule();
    
    // Auto-fill from user session if available
    if (user?.teaching_code) setTeachingCode(user.teaching_code);
    
    // Check if previously joined
    const saved = localStorage.getItem(`rekafisika_session_${id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setGroupName(parsed.groupName);
      setMembers(parsed.members);
      setTeachingCode(parsed.teachingCode);
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [id]);

  const fetchModule = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data.is_locked && !isTeacher) {
        alert('Modul ini masih terkunci.');
        navigate('/modul');
        return;
      }
      
      setModule(data as Module);
    } catch (err) {
      console.error('Error fetching module:', err);
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
            // Ping presence every 5 seconds
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

    localStorage.setItem(`rekafisika_session_${id}`, JSON.stringify({
      groupName: isTeacher ? 'GURU' : groupName,
      members: isTeacher ? user?.nama : members,
      teachingCode
    }));

    setupRealtime(teachingCode);
    
    if (isTeacher) {
      // Sync initial state
      updateTeacherState(0);
    } else {
      // Fetch current state from DB as fallback
      fetchTeacherState(teachingCode);
    }
  };

  const fetchTeacherState = async (code: string) => {
    const { data } = await supabase
      .from('sesi_kelas')
      .select('halaman_aktif')
      .eq('kode_kelas', code)
      .single();
    
    if (data) {
      setCurrentPage(data.halaman_aktif);
      if (data.halaman_aktif > 0) setInWaitingRoom(false);
    }
  };

  const updateTeacherState = async (page: number) => {
    if (!isTeacher) return;
    
    // Broadcast
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'page_sync',
        payload: { page }
      });
    }

    // Persist to DB
    await supabase.from('sesi_kelas').upsert({
      kode_kelas: teachingCode,
      module_id: id,
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
      // Broadcast end
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'session_ended',
          payload: {}
        });
      }
      // Cleanup session
      await supabase.from('sesi_kelas').delete().eq('kode_kelas', teachingCode);
      navigate('/home');
    } else {
      // Submit progress
      await supabase.from('module_progress').upsert({
        student_nim: user?.nim,
        module_id: id,
        is_completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student_nim, module_id' });

      alert('Selamat! Modul berhasil diselesaikan.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Memuat Materi...</p>
      </div>
    );
  }

  if (!module) return <div>Modul tidak ditemukan.</div>;

  // --- Rendering Logic ---

  if (currentPage === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-[Inter,sans-serif] pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/modul')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Persiapan Modul</p>
              <h1 className="text-sm font-bold text-slate-800 line-clamp-1">{module.topic}</h1>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 mt-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Info Section */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest">Langkah Persiapan</span>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">{module.topic}</h2>
              </div>
              <div 
                className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: marked.parse(module.description || '') }}
              />

              {/* Form Registration */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 text-primary-500 mb-2">
                  <DoorOpen size={24} />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Pendaftaran Sesi</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-1 tracking-widest">Kode Pengajaran Guru</label>
                    <input 
                      type="text" 
                      value={teachingCode}
                      onChange={(e) => setTeachingCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
                      placeholder="Contoh: PHYS101"
                    />
                  </div>
                  {!isTeacher && (
                    <>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-1 tracking-widest">Nama Kelompok</label>
                        <input 
                          type="text" 
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none" 
                          placeholder="Misal: Kelompok 1 / Newton"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-1 tracking-widest">Anggota Kelompok</label>
                        <textarea 
                          value={members}
                          onChange={(e) => setMembers(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none resize-none" 
                          rows={2} 
                          placeholder="Sebutkan nama lengkap anggota..."
                        />
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={handleJoin}
                  className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20"
                >
                  {isTeacher ? 'Buka Sesi' : 'Gabung Kelas'}
                </button>
              </div>
            </motion.div>

            {/* Visual/Status Section */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
              <div className="aspect-square bg-slate-200 rounded-[3rem] overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent z-10" />
                <img 
                  src={`https://source.unsplash.com/800x800/?physics,science,education&${id}`} 
                  alt="Module Cover"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-8 left-8 right-8 z-20 bg-white/90 backdrop-blur p-6 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white">
                      <Radio className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sistem Sinkronisasi</p>
                      <p className="text-sm font-bold text-slate-800">Pembelajaran Terkendali Guru</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Waiting Room Overlay */}
        <AnimatePresence>
          {isSyncing && inWaitingRoom && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6"
            >
              <div className="max-w-2xl w-full bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-orange-500" />
                
                {isTeacher ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-500">
                      <DoorOpen size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Ruang Tunggu Kelas</h2>
                    <p className="text-slate-500 text-sm mt-2">Kode Akses: <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{teachingCode}</span></p>
                    
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 my-8 min-h-[200px]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 text-sm">Peserta yang Bergabung</h3>
                        <span className="bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-full">{joinedGroups.size} Kelompok</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {joinedGroups.size === 0 ? (
                          <div className="text-center w-full text-slate-400 text-sm py-8">Belum ada peserta masuk...</div>
                        ) : (
                          Array.from(joinedGroups).map(grp => (
                            <div key={grp} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-2">
                              <CheckCircle size={14} className="text-emerald-500" />
                              {grp}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleStartSession}
                      className="w-full py-4 bg-primary-500 hover:bg-primary-600 rounded-2xl font-black text-white text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Play size={16} /> Mulai Sesi Pembelajaran
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <div className="w-full h-full border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin absolute" />
                      <Hourglass className="text-orange-400 animate-pulse" size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Menunggu Guru...</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">Anda sudah terdaftar. Tunggu aba-aba dari guru Anda untuk memulai sesi pembelajaran sinkron ini.</p>
                    
                    <div className="mt-8 inline-block bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left w-full max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-400">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sesi Aktif</p>
                          <p className="font-bold text-slate-700 text-sm">{teachingCode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- Step Content Rendering ---

  const currentStep = module.steps[currentPage - 1];

  const renderStepIcon = (type: string) => {
    switch (type) {
      case 'ppt':
      case 'pdf': return <FileText />;
      case 'video': return <Play />;
      case 'phet': return <FlaskConical />;
      case 'refleksi': return <Brain />;
      default: return <LinkIcon />;
    }
  };

  const renderStepColor = (type: string) => {
    switch (type) {
      case 'ppt': return 'bg-orange-50 text-orange-500';
      case 'pdf': return 'bg-rose-50 text-rose-500';
      case 'video': return 'bg-red-50 text-red-500';
      case 'phet': return 'bg-emerald-50 text-emerald-500';
      case 'refleksi': return 'bg-purple-50 text-purple-500';
      default: return 'bg-blue-50 text-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-[Inter,sans-serif] flex flex-col pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/modul')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Modul Pembelajaran</p>
            <h1 className="text-sm font-bold text-slate-800 line-clamp-1">{module.topic}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {module.lkpd_url && (
            <a 
              href={module.lkpd_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs hover:bg-orange-100 transition-all border border-orange-100"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">Buka LKPD</span>
            </a>
          )}
          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
            <Radio size={14} className="animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Step Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <span className={`w-12 h-12 rounded-2xl ${renderStepColor(currentStep.type)} font-bold flex items-center justify-center text-xl shadow-sm`}>
                  {renderStepIcon(currentStep.type)}
                </span>
                <div>
                  <h4 className="text-xl font-black text-slate-900 leading-tight">{currentStep.title}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{currentStep.type}</span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[9px] uppercase font-black text-slate-300 tracking-tighter">Langkah {currentPage}</p>
              </div>
            </div>

            {/* Instruction */}
            {currentStep.instruction && (
              <div className="bg-primary-50 text-primary-900 text-sm p-5 rounded-2xl border-l-4 border-primary-500 shadow-sm">
                <div className="flex items-start gap-4">
                  <Info className="text-primary-500 mt-0.5 shrink-0" size={20} />
                  <p className="leading-relaxed font-medium">{currentStep.instruction}</p>
                </div>
              </div>
            )}

            {/* Step Specific Content */}
            <div className="immersive-content">
              {(currentStep.type === 'pdf' || currentStep.type === 'ppt') && (
                <PDFViewer url={currentStep.url} startPage={currentStep.start_page} endPage={currentStep.end_page} />
              )}

              {currentStep.type === 'video' && (
                <VideoViewer 
                  url={currentStep.url} 
                  startTime={currentStep.start_time} 
                  endTime={currentStep.end_time} 
                  isTeacher={isTeacher} 
                />
              )}

              {currentStep.type === 'phet' && (
                <div className="space-y-4">
                  <div className="w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl h-[600px]">
                    <iframe src={currentStep.url} className="w-full h-full" allowFullScreen title="PhET Simulation" />
                  </div>
                  {/* PhET Questions & Tables would go here, simplified for now */}
                </div>
              )}

              {currentStep.type === 'refleksi' && (
                <div className="space-y-6">
                  {(currentStep.questions || []).map((q, qIdx) => (
                    <div key={qIdx} className="space-y-3 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-sm font-bold text-slate-700">{qIdx + 1}. {q}</p>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                        rows={3}
                        placeholder="Ketik jawabanmu di sini..."
                        value={answers[currentPage]?.[qIdx] || ''}
                        onChange={(e) => {
                          const newStepAnswers = { ...answers[currentPage], [qIdx]: e.target.value };
                          setAnswers({ ...answers, [currentPage]: newStepAnswers });
                        }}
                        onBlur={() => saveRefleksi(currentPage, answers[currentPage])}
                      />
                    </div>
                  ))}
                  {saveStatus && <p className="text-center text-[10px] font-bold text-primary-500 uppercase tracking-widest">{saveStatus}</p>}
                </div>
              )}

              {currentStep.type === 'link' && (
                <div className="mt-2 p-8 bg-white rounded-3xl border border-dotted border-slate-300 flex flex-col items-center text-center gap-4 shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 text-2xl shadow-sm">
                    <LinkIcon />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-700">Tautan Eksternal</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{currentStep.url}</p>
                  </div>
                  <a href={currentStep.url} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all">Buka Tautan</a>
                </div>
              )}
            </div>

            {/* Quiz Section (Optional) */}
            {currentStep.question && (
              <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl mt-8">
                <div className="flex items-start gap-4 mb-4">
                  <MessageSquare className="text-primary-400 mt-1" />
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Cek Pemahaman</p>
                    <p className="text-white font-bold leading-relaxed">{currentStep.question}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Masukkan jawaban..." className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-600" />
                  <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Verifikasi</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 w-full px-6 pb-6 pt-10 pointer-events-none z-50">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200 p-4 shadow-2xl rounded-3xl pointer-events-auto flex items-center justify-between gap-4">
          <button 
            onClick={handlePrev}
            disabled={!isTeacher || currentPage <= 1}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>
          
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Langkah</p>
            <p className="text-sm font-bold text-slate-700">{currentPage} / {module.steps.length}</p>
            {!isTeacher && <div className="text-[9px] text-primary-500 font-bold uppercase tracking-tighter animate-pulse mt-1">Layar Terkendali Guru</div>}
          </div>

          {currentPage === module.steps.length ? (
            <button 
              onClick={() => handleFinishModule()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-all"
            >
              <CheckCircle size={20} />
              <span className="hidden sm:inline">Selesaikan Modul</span>
            </button>
          ) : (
            <button 
              onClick={handleNext}
              disabled={!isTeacher}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-all disabled:opacity-50"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
" ,Description:
