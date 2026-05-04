import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Users, 
  ChevronRight, Menu, Loader2,
  ShieldCheck, ArrowLeft, Trash2, Plus, 
  X, Lock, Unlock, FileText, 
  Upload, Sparkles, LogOut,
  Route, ArrowUp, ArrowDown, Brain,
  Table as TableIcon,
  Edit3, ListTodo
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Module, LearningPath, ModuleStep } from '../lib/supabase';

// --- Types ---
interface Profile {
  id: string;
  nim: string;
  nama: string;
  role: 'admin' | 'teacher' | 'student';
  profile_photo_url?: string;
}

interface Stat {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}

// --- Main Component ---

export default function Admin() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  // Data States
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Management States (Modules)
  const [searchQuery, setSearchQuery] = useState('');
  const [editingModule, setEditingModule] = useState<Partial<Module> | null>(null);
  
  // Management States (Learning Paths)
  const [editingPath, setEditingPath] = useState<Partial<LearningPath> | null>(null);
  const [pathModules, setPathModules] = useState<string[]>([]); // Array of module IDs

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [pRes, mRes, lpRes] = await Promise.all([
        supabase.from('profiles').select('*').order('nama'),
        supabase.from('modules').select('*').order('sort_order'),
        supabase.from('learning_paths').select('*, learning_path_modules(module_id, order_index)').order('created_at', { ascending: false })
      ]);

      setProfiles(pRes.data || []);
      setModules(mRes.data || []);
      setLearningPaths(lpRes.data || []);

      const studentCount = pRes.data?.filter(p => p.role === 'student').length || 0;
      const teacherCount = pRes.data?.filter(p => p.role === 'teacher').length || 0;
      const moduleCount = mRes.data?.length || 0;
      const pathCount = lpRes.data?.length || 0;

      setStats([
        { label: 'Mahasiswa', value: studentCount, icon: Users, color: 'bg-blue-500' },
        { label: 'Guru/Dosen', value: teacherCount, icon: ShieldCheck, color: 'bg-indigo-500' },
        { label: 'Total Modul', value: moduleCount, icon: BookOpen, color: 'bg-emerald-500' },
        { label: 'Rangkaian Ajar', value: pathCount, icon: Route, color: 'bg-purple-500' },
      ]);

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole as any } : p));
    } catch (err) {
      alert('Gagal update role: ' + (err as any).message);
    }
  };

  // --- Module Management ---
  const handleSaveModule = async () => {
    if (!editingModule?.topic) return alert('Judul wajib diisi');
    setIsSaving(true);
    try {
      const payload = {
        topic: editingModule.topic,
        description: editingModule.description || '',
        sort_order: editingModule.sort_order || 1,
        steps: editingModule.steps || [],
        lkpd_url: editingModule.lkpd_url || null,
        lkpd_title: editingModule.lkpd_title || null,
        is_visible: editingModule.is_visible ?? true,
        is_locked: editingModule.is_locked ?? false,
      };

      let error;
      if (editingModule.id) {
        const { error: err } = await supabase.from('modules').update(payload).eq('id', editingModule.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('modules').insert([payload]);
        error = err;
      }

      if (error) throw error;
      setEditingModule(null);
      fetchInitialData();
    } catch (err) {
      alert('Gagal simpan modul: ' + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Hapus modul ini secara permanen?')) return;
    try {
      await supabase.from('modules').delete().eq('id', id);
      fetchInitialData();
    } catch (err) {
      alert('Gagal hapus modul');
    }
  };

  const toggleModuleLock = async (id: string, current: boolean) => {
    try {
      await supabase.from('modules').update({ is_locked: !current }).eq('id', id);
      setModules(prev => prev.map(m => m.id === id ? { ...m, is_locked: !current } : m));
    } catch (err) {
      alert('Gagal update status kunci');
    }
  };

  // --- Learning Path Management ---
  const handleSavePath = async () => {
    if (!editingPath?.title) return alert('Judul wajib diisi');
    if (pathModules.length === 0) return alert('Pilih minimal satu materi');
    
    setIsSaving(true);
    try {
      const pathPayload = {
        title: editingPath.title,
        description: editingPath.description || '',
        is_visible: editingPath.is_visible ?? true,
        reflection_questions: editingPath.reflection_questions || []
      };

      let pathId = editingPath.id;
      if (pathId) {
        await supabase.from('learning_paths').update(pathPayload).eq('id', pathId);
        await supabase.from('learning_path_modules').delete().eq('path_id', pathId);
      } else {
        const { data, error } = await supabase.from('learning_paths').insert([pathPayload]).select().single();
        if (error) throw error;
        pathId = data.id;
      }

      const relations = pathModules.map((mId, idx) => ({
        path_id: pathId,
        module_id: mId,
        order_index: idx + 1
      }));

      await supabase.from('learning_path_modules').insert(relations);

      setEditingPath(null);
      setPathModules([]);
      fetchInitialData();
    } catch (err) {
      alert('Gagal simpan rangkaian: ' + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deletePath = async (id: string) => {
    if (!confirm('Hapus rangkaian ajar ini?')) return;
    try {
      await supabase.from('learning_paths').delete().eq('id', id);
      fetchInitialData();
    } catch (err) {
      alert('Gagal hapus rangkaian');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'modules', label: 'Manajemen Modul', icon: BookOpen },
    { id: 'paths', label: 'Rangkaian Ajar', icon: Route },
    { id: 'users', label: 'Manajemen User', icon: Users },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-[Inter,sans-serif] flex">
      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col
      `}>
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black">A</div>
            <span className="font-black text-slate-800 text-lg tracking-tight">Admin Area</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Navigasi Utama</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all
                ${activeSection === item.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
              `}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
              {activeSection === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
           <Link to="/home" className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all mb-2">
            <ArrowLeft size={20} />
            <span className="text-sm text-slate-600">Halaman Utama</span>
          </Link>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-black uppercase tracking-widest">Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-500">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">{activeSection.replace('_', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} className="text-blue-500" />
              Sistem Aktif
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
               {user?.nama?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* --- SECTIONS: DASHBOARD --- */}
                {activeSection === 'dashboard' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                          <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                          </div>
                          <h3 className="text-4xl font-black text-slate-900 mb-1">{stat.value}</h3>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                       <div className="relative z-10">
                         <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Selamat Datang di RekaFisika Admin</h3>
                         <p className="text-slate-500 leading-relaxed max-w-2xl mb-8">Gunakan panel ini untuk mengelola modul pembelajaran, rangkaian ajar, dan status pengguna. Semua perubahan yang Anda lakukan akan langsung tersinkronisasi ke seluruh platform.</p>
                         <div className="flex gap-4">
                           <button onClick={() => setActiveSection('modules')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">Manajemen Materi</button>
                           <button onClick={() => setActiveSection('paths')} className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">Atur Rangkaian</button>
                         </div>
                       </div>
                       <Sparkles size={200} className="absolute -right-20 -bottom-20 text-slate-50 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* --- SECTIONS: MODULES --- */}
                {activeSection === 'modules' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                       <div>
                         <h3 className="text-2xl font-black text-slate-800 tracking-tight">Katalog Modul</h3>
                         <p className="text-slate-400 text-sm font-medium">Total {modules.length} modul aktif di sistem.</p>
                       </div>
                       <button 
                        onClick={() => setEditingModule({ topic: '', steps: [], sort_order: modules.length + 1 })}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                       >
                         <Plus size={18} /> Tambah Modul
                       </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {modules.map(m => (
                        <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm">
                           <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">
                               {m.sort_order}
                             </div>
                             <div>
                               <h4 className="font-black text-slate-800 text-lg">{m.topic}</h4>
                               <div className="flex items-center gap-3 mt-1">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.steps?.length || 0} Langkah Belajar</span>
                                 {m.is_locked && <span className="flex items-center gap-1 text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase"><Lock size={10}/> Locked</span>}
                               </div>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <button 
                              onClick={() => toggleModuleLock(m.id, m.is_locked)}
                              className={`p-3 rounded-xl transition-all ${m.is_locked ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}`}
                             >
                               {m.is_locked ? <Lock size={18} /> : <Unlock size={18} />}
                             </button>
                             <button 
                              onClick={() => setEditingModule(m)}
                              className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                             >
                               <FileText size={18} />
                             </button>
                             <button 
                              onClick={() => deleteModule(m.id)}
                              className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                             >
                               <Trash2 size={18} />
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- SECTIONS: LEARNING PATHS --- */}
                {activeSection === 'paths' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                       <div>
                         <h3 className="text-2xl font-black text-slate-800 tracking-tight">Rangkaian Ajar</h3>
                         <p className="text-slate-400 text-sm font-medium">Gabungkan beberapa materi menjadi alur pembelajaran.</p>
                       </div>
                       <button 
                        onClick={() => {
                          setEditingPath({ title: '', description: '', is_visible: true, reflection_questions: [] });
                          setPathModules([]);
                        }}
                        className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                       >
                         <Plus size={18} /> Buat Rangkaian
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {learningPaths.map(path => (
                        <div key={path.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                           <div className="flex justify-between items-start mb-6">
                              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Route size={24} />
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => {
                                  setEditingPath(path);
                                  const sorted = (path as any).learning_path_modules?.sort((a:any, b:any) => a.order_index - b.order_index) || [];
                                  setPathModules(sorted.map((m:any) => m.module_id));
                                }} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-lg"><FileText size={16}/></button>
                                <button onClick={() => deletePath(path.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 size={16}/></button>
                              </div>
                           </div>
                           <h4 className="text-xl font-black text-slate-800 mb-2">{path.title}</h4>
                           <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-6">{path.description}</p>
                           
                           <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Alur Materi:</p>
                              <div className="flex flex-col gap-2">
                                {(path as any).learning_path_modules?.sort((a:any, b:any) => a.order_index - b.order_index).map((pm:any, idx:number) => (
                                  <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] border border-slate-200">{idx+1}</span>
                                    {modules.find(m => m.id === pm.module_id)?.topic || 'Materi tidak ditemukan'}
                                  </div>
                                ))}
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- SECTIONS: USERS --- */}
                {activeSection === 'users' && (
                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Pengguna</h3>
                          <p className="text-slate-400 text-sm mt-1 font-medium">Total {profiles.length} pengguna terdaftar</p>
                        </div>
                        <div className="relative w-full md:w-80">
                          <input 
                            type="text" 
                            placeholder="Cari nama atau NIM..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                          <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-6 pb-2">Profil & Email</th>
                              <th className="px-6 pb-2">Role Saat Ini</th>
                              <th className="px-6 pb-2">Aksi Role</th>
                              <th className="px-6 pb-2 text-right">Aksi Akun</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profiles.filter(p => p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || p.nim.includes(searchQuery)).map(p => (
                              <tr key={p.id} className="bg-white group">
                                <td className="px-6 py-4 rounded-l-3xl border-y border-l border-slate-100 group-hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold">
                                      {p.nama[0]}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-slate-800">{p.nama}</p>
                                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{p.nim}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 border-y border-slate-100 group-hover:bg-slate-50 transition-colors">
                                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${
                                    p.role === 'admin' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 
                                    p.role === 'teacher' ? 'bg-blue-100 text-blue-600' : 
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {p.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 border-y border-slate-100 group-hover:bg-slate-50 transition-colors">
                                  <select 
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-widest"
                                    value={p.role}
                                    onChange={(e) => updateUserRole(p.id, e.target.value)}
                                  >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 rounded-r-3xl border-y border-r border-slate-100 text-right group-hover:bg-slate-50 transition-colors">
                                  <button className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                                    <Trash2 size={20} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- MODAL: EDIT MODULE --- */}
      {editingModule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
           >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingModule.id ? 'Edit Modul' : 'Tambah Modul Baru'}</h3>
                <button onClick={() => setEditingModule(null)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="md:col-span-1">
                     <label className="block text-[10px] font-black text-slate-400 mb-2 pl-2">URUTAN TAMPIL</label>
                     <input type="number" value={editingModule.sort_order} onChange={e => setEditingModule({...editingModule, sort_order: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-lg outline-none" />
                   </div>
                   <div className="md:col-span-3">
                     <label className="block text-[10px] font-black text-slate-400 mb-2 pl-2">JUDUL MODUL</label>
                     <input type="text" value={editingModule.topic} onChange={e => setEditingModule({...editingModule, topic: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-lg outline-none" />
                   </div>
                   <div className="md:col-span-4">
                     <label className="block text-[10px] font-black text-slate-400 mb-2 pl-2">DESKRIPSI</label>
                     <textarea value={editingModule.description} onChange={e => setEditingModule({...editingModule, description: e.target.value})} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none" />
                   </div>
                </div>

                <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50 space-y-6">
                   <h4 className="flex items-center gap-3 text-blue-700 font-black uppercase tracking-widest text-xs"><FileText size={18} /> LKPD SETTINGS</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input type="text" placeholder="Judul LKPD" value={editingModule.lkpd_title || ''} onChange={e => setEditingModule({...editingModule, lkpd_title: e.target.value})} className="bg-white border border-blue-100 rounded-2xl px-6 py-4 text-sm font-bold" />
                     <div className="flex gap-2">
                       <input type="text" placeholder="URL LKPD" value={editingModule.lkpd_url || ''} onChange={e => setEditingModule({...editingModule, lkpd_url: e.target.value})} className="flex-1 bg-white border border-blue-100 rounded-2xl px-6 py-4 text-sm font-bold" />
                       <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0"><Upload size={20} /></div>
                     </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center pb-4 border-b">
                     <h4 className="font-black text-slate-800 text-xl">Langkah Pembelajaran</h4>
                     <button onClick={() => {
                       const newSteps: ModuleStep[] = [...(editingModule.steps || []), { title: '', type: 'pdf', url: '', instruction: '', kegiatan: [] } as any];
                       setEditingModule({...editingModule, steps: newSteps});
                     }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Tambah Langkah</button>
                   </div>
                   <div className="space-y-12">
                      {editingModule.steps?.map((step: any, sIdx) => (
                        <div key={sIdx} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 space-y-8 relative shadow-sm">
                           <div className="absolute top-6 right-6 flex items-center gap-3">
                              <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">{sIdx + 1}</span>
                              <button onClick={() => setEditingModule({...editingModule, steps: editingModule.steps?.filter((_, i) => i !== sIdx)})} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"><Trash2 size={18} /></button>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 mb-2 pl-2">JUDUL LANGKAH</label>
                                <input type="text" value={step.title} onChange={e => {
                                  const newSteps = [...(editingModule.steps || [])];
                                  newSteps[sIdx].title = e.target.value;
                                  setEditingModule({...editingModule, steps: newSteps});
                                }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 pl-2">TIPE KONTEN</label>
                                <select value={step.type} onChange={e => {
                                  const newSteps = [...(editingModule.steps || [])];
                                  newSteps[sIdx].type = e.target.value as any;
                                  setEditingModule({...editingModule, steps: newSteps});
                                }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black uppercase">
                                  <option value="ppt">PowerPoint</option>
                                  <option value="pdf">PDF Viewer</option>
                                  <option value="video">Video (YT)</option>
                                  <option value="phet">PhET Simulasi</option>
                                  <option value="refleksi">Refleksi</option>
                                  <option value="link">External Link</option>
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-[10px] font-black text-slate-400 mb-2 pl-2">URL / SUMBER MEDIA</label>
                                <input type="text" value={step.url} onChange={e => {
                                  const newSteps = [...(editingModule.steps || [])];
                                  newSteps[sIdx].url = e.target.value;
                                  setEditingModule({...editingModule, steps: newSteps});
                                }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-mono text-blue-600" />
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-[10px] font-black text-slate-400 mb-2 pl-2">INSTRUKSI KHUSUS</label>
                                <textarea value={step.instruction} onChange={e => {
                                  const newSteps = [...(editingModule.steps || [])];
                                  newSteps[sIdx].instruction = e.target.value;
                                  setEditingModule({...editingModule, steps: newSteps});
                                }} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-medium" />
                              </div>
                           </div>

                           {/* KEGIATAN (WORKSHEET) EDITOR */}
                           <div className="pt-8 border-t border-slate-100 space-y-6">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                    <ListTodo className="text-blue-600" size={20} />
                                    <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Kegiatan Worksheet</h5>
                                 </div>
                                 <button 
                                  onClick={() => {
                                    const newSteps = [...(editingModule.steps || [])];
                                    const targetStep = newSteps[sIdx];
                                    if (targetStep) {
                                      if (!targetStep.kegiatan) targetStep.kegiatan = [];
                                      targetStep.kegiatan.push({ title: 'Kegiatan Baru', questions: [], tables: [] });
                                      setEditingModule({...editingModule, steps: newSteps});
                                    }
                                  }}
                                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-colors"
                                 >+ Tambah Kegiatan</button>
                              </div>

                              <div className="space-y-8">
                                 {(step.kegiatan || []).map((keg: any, kIdx: number) => (
                                   <div key={kIdx} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-8 relative">
                                      <button 
                                        onClick={() => {
                                          const newSteps = [...(editingModule.steps || [])];
                                          const targetStep = newSteps[sIdx];
                                          if (targetStep && targetStep.kegiatan) {
                                            targetStep.kegiatan = targetStep.kegiatan.filter((_, i) => i !== kIdx);
                                            setEditingModule({...editingModule, steps: newSteps});
                                          }
                                        }}
                                        className="absolute top-6 right-6 text-slate-300 hover:text-rose-500"
                                      ><Trash2 size={18} /></button>

                                      <div className="max-w-md">
                                         <label className="block text-[10px] font-black text-slate-400 mb-2 pl-2">JUDUL KEGIATAN</label>
                                         <input 
                                          type="text" 
                                          value={keg.title}
                                          onChange={e => {
                                            const newSteps = [...(editingModule.steps || [])];
                                            const targetKeg = newSteps[sIdx].kegiatan?.[kIdx];
                                            if (targetKeg) {
                                              targetKeg.title = e.target.value;
                                              setEditingModule({...editingModule, steps: newSteps});
                                            }
                                          }}
                                          className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black"
                                          placeholder="Contoh: Kegiatan 1.1"
                                         />
                                      </div>

                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                         {/* Questions in Activity */}
                                         <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                               <Edit3 className="text-blue-400" size={16} />
                                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pertanyaan Isian</p>
                                            </div>
                                            <div className="space-y-3">
                                               {(keg.questions || []).map((q: string, qIdx: number) => (
                                                 <div key={qIdx} className="flex gap-2">
                                                    <input 
                                                      type="text" 
                                                      value={q}
                                                      onChange={e => {
                                                        const newSteps = [...(editingModule.steps || [])];
                                                        const targetKeg = newSteps[sIdx].kegiatan?.[kIdx];
                                                        if (targetKeg && targetKeg.questions) {
                                                          targetKeg.questions[qIdx] = e.target.value;
                                                          setEditingModule({...editingModule, steps: newSteps});
                                                        }
                                                      }}
                                                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs"
                                                      placeholder={`Pertanyaan ${qIdx + 1}`}
                                                    />
                                                    <button onClick={() => {
                                                       const newSteps = [...(editingModule.steps || [])];
                                                       const targetKeg = newSteps[sIdx].kegiatan?.[kIdx];
                                                       if (targetKeg && targetKeg.questions) {
                                                          targetKeg.questions = targetKeg.questions.filter((_, i) => i !== qIdx);
                                                          setEditingModule({...editingModule, steps: newSteps});
                                                       }
                                                    }} className="text-rose-300"><Trash2 size={14}/></button>
                                                 </div>
                                               ))}
                                               <button onClick={() => {
                                                  const newSteps = [...(editingModule.steps || [])];
                                                  const targetKeg = newSteps[sIdx].kegiatan?.[kIdx];
                                                  if (targetKeg) {
                                                    if (!targetKeg.questions) targetKeg.questions = [];
                                                    targetKeg.questions.push('');
                                                    setEditingModule({...editingModule, steps: newSteps});
                                                  }
                                               }} className="w-full py-3 bg-white border border-slate-200 border-dashed rounded-xl text-[9px] font-black text-blue-500 uppercase tracking-widest">+ Isian Baru</button>
                                            </div>
                                         </div>

                                         {/* Tables in Activity */}
                                         <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                               <TableIcon className="text-emerald-400" size={16} />
                                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tabel Observasi</p>
                                            </div>
                                            <div className="space-y-4">
                                               {(keg.tables || []).map((table: any, tIdx: number) => (
                                                 <div key={tIdx} className="p-5 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                                                    <div className="flex justify-between items-center">
                                                       <input 
                                                        type="text" 
                                                        value={table.title}
                                                        onChange={e => {
                                                          const newSteps = [...(editingModule.steps || [])];
                                                          const targetTable = newSteps[sIdx].kegiatan?.[kIdx]?.tables?.[tIdx];
                                                          if (targetTable) {
                                                            targetTable.title = e.target.value;
                                                            setEditingModule({...editingModule, steps: newSteps});
                                                          }
                                                        }}
                                                        className="text-[10px] font-black uppercase text-emerald-600 border-none w-full"
                                                        placeholder="Judul Tabel"
                                                       />
                                                       <button onClick={() => {
                                                          const newSteps = [...(editingModule.steps || [])];
                                                          const targetKeg = newSteps[sIdx].kegiatan?.[kIdx];
                                                          if (targetKeg && targetKeg.tables) {
                                                            targetKeg.tables = targetKeg.tables.filter((_, i) => i !== tIdx);
                                                            setEditingModule({...editingModule, steps: newSteps});
                                                          }
                                                       }}><X size={14}/></button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                       {table.columns.map((col: string, cIdx: number) => (
                                                         <div key={cIdx} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border">
                                                            <input type="text" value={col} onChange={e => {
                                                              const newSteps = [...(editingModule.steps || [])];
                                                              const targetTable = newSteps[sIdx].kegiatan?.[kIdx]?.tables?.[tIdx];
                                                              if (targetTable && targetTable.columns) {
                                                                targetTable.columns[cIdx] = e.target.value;
                                                                setEditingModule({...editingModule, steps: newSteps});
                                                              }
                                                            }} className="bg-transparent border-none text-[9px] w-16" />
                                                            <button onClick={() => {
                                                              const newSteps = [...(editingModule.steps || [])];
                                                              const targetTable = newSteps[sIdx].kegiatan?.[kIdx]?.tables?.[tIdx];
                                                              if (targetTable && targetTable.columns) {
                                                                targetTable.columns = targetTable.columns.filter((_, i) => i !== cIdx);
                                                                setEditingModule({...editingModule, steps: newSteps});
                                                              }
                                                            }}><X size={8}/></button>
                                                         </div>
                                                       ))}
                                                       <button onClick={() => {
                                                          const newSteps = [...(editingModule.steps || [])];
                                                          const targetTable = newSteps[sIdx].kegiatan?.[kIdx]?.tables?.[tIdx];
                                                          if (targetTable) {
                                                            if (!targetTable.columns) targetTable.columns = [];
                                                            targetTable.columns.push('Kolom');
                                                            setEditingModule({...editingModule, steps: newSteps});
                                                          }
                                                       }} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold">+ Kolom</button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                       <label className="text-[9px] font-black text-slate-400">BARIS:</label>
                                                       <input type="number" value={table.rows} onChange={e => {
                                                          const newSteps = [...(editingModule.steps || [])];
                                                          const targetTable = newSteps[sIdx].kegiatan?.[kIdx]?.tables?.[tIdx];
                                                          if (targetTable) {
                                                            targetTable.rows = parseInt(e.target.value) || 1;
                                                            setEditingModule({...editingModule, steps: newSteps});
                                                          }
                                                       }} className="w-12 bg-slate-50 border rounded-lg px-2 py-1 text-[9px] font-bold" />
                                                    </div>
                                                 </div>
                                               ))}
                                               <button onClick={() => {
                                                  const newSteps = [...(editingModule.steps || [])];
                                                  const targetKeg = newSteps[sIdx].kegiatan?.[kIdx];
                                                  if (targetKeg) {
                                                    if (!targetKeg.tables) targetKeg.tables = [];
                                                    targetKeg.tables.push({ title: '', columns: ['Data'], rows: 3 });
                                                    setEditingModule({...editingModule, steps: newSteps});
                                                  }
                                               }} className="w-full py-3 bg-white border border-slate-200 border-dashed rounded-xl text-[9px] font-black text-emerald-500 uppercase tracking-widest">+ Tabel Baru</button>
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="p-8 border-t flex justify-end gap-4 bg-slate-50/50">
                <button onClick={() => setEditingModule(null)} className="px-8 py-4 font-bold text-slate-400">Batal</button>
                <button onClick={handleSaveModule} disabled={isSaving} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-blue-600/20 disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" /> : 'Simpan Modul'}
                </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* --- MODAL: EDIT LEARNING PATH --- */}
      {editingPath && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b flex justify-between">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingPath.id ? 'Edit Rangkaian' : 'Buat Rangkaian Ajar'}</h3>
                <button onClick={() => setEditingPath(null)}><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <div className="space-y-6">
                  <input type="text" value={editingPath.title} onChange={e => setEditingPath({...editingPath, title: e.target.value})} placeholder="Nama Rangkaian" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-lg outline-none" />
                  <textarea value={editingPath.description} onChange={e => setEditingPath({...editingPath, description: e.target.value})} placeholder="Deskripsi" rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-3">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Alur Materi:</p>
                     <div className="flex flex-col gap-3 min-h-[100px] p-4 bg-slate-50 rounded-[2rem] border-2 border-dashed">
                       {pathModules.map((mId, idx) => {
                         const m = modules.find(mod => mod.id === mId);
                         return (
                           <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center group">
                             <div className="flex items-center gap-3">
                               <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                               <span className="text-xs font-bold">{m?.topic}</span>
                             </div>
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                               <button onClick={() => { if(idx > 0) { const next = [...pathModules]; [next[idx], next[idx-1]] = [next[idx-1], next[idx]]; setPathModules(next); } }}><ArrowUp size={14}/></button>
                               <button onClick={() => { if(idx < pathModules.length - 1) { const next = [...pathModules]; [next[idx], next[idx+1]] = [next[idx+1], next[idx]]; setPathModules(next); } }}><ArrowDown size={14}/></button>
                               <button onClick={() => setPathModules(pathModules.filter((_, i) => i !== idx))}><Trash2 size={14}/></button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                   <div className="space-y-3">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pilih Materi:</p>
                     <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto">
                        {modules.filter(m => !pathModules.includes(m.id)).map(m => (
                          <button key={m.id} onClick={() => setPathModules([...pathModules, m.id])} className="text-left bg-white p-4 rounded-2xl border hover:bg-purple-50 group">
                            <div className="flex justify-between items-center"><span className="text-xs font-bold">{m.topic}</span><Plus size={14}/></div>
                          </button>
                        ))}
                     </div>
                   </div>
                </div>

                {/* Path Reflection Editor */}
                <div className="bg-purple-50/50 p-8 rounded-[2.5rem] border border-purple-100/50 space-y-6">
                   <h4 className="flex items-center gap-3 text-purple-700 font-black uppercase tracking-widest text-xs"><Brain size={18} /> Pertanyaan Refleksi Akhir Rangkaian</h4>
                   <div className="space-y-3">
                      {editingPath.reflection_questions?.map((q, qIdx) => (
                        <div key={qIdx} className="flex gap-2">
                           <input 
                            type="text" 
                            value={q}
                            onChange={e => {
                              const newQs = [...(editingPath.reflection_questions || [])];
                              newQs[qIdx] = e.target.value;
                              setEditingPath({...editingPath, reflection_questions: newQs});
                            }}
                            className="flex-1 bg-white border border-purple-100 rounded-xl px-4 py-3 text-sm font-medium"
                            placeholder={`Pertanyaan ${qIdx + 1}`}
                           />
                           <button onClick={() => setEditingPath({...editingPath, reflection_questions: editingPath.reflection_questions?.filter((_, i) => i !== qIdx)})} className="p-3 text-rose-400 hover:text-rose-600"><Trash2 size={18}/></button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setEditingPath({...editingPath, reflection_questions: [...(editingPath.reflection_questions || []), '']})}
                        className="w-full py-3 bg-white border border-purple-200 border-dashed rounded-xl text-xs font-black text-purple-500 hover:bg-purple-50 transition-all uppercase tracking-widest"
                      >
                        + Tambah Pertanyaan Refleksi
                      </button>
                   </div>
                </div>
              </div>
              <div className="p-8 border-t flex justify-end gap-4 bg-slate-50/50">
                <button onClick={() => setEditingPath(null)} className="px-8 py-4 font-bold text-slate-400">Batal</button>
                <button onClick={handleSavePath} disabled={isSaving} className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-purple-600/20 disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" /> : 'Simpan Rangkaian'}
                </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
