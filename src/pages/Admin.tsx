import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Users, 
  ChevronRight, Menu, Loader2,
  ShieldCheck, ArrowLeft, Trash2, Plus, 
  Save, X, Lock, Unlock, FileText, 
  List, Upload, Sparkles, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// --- Types ---
interface Profile {
  id: string;
  nim: string;
  nama: string;
  role: 'admin' | 'teacher' | 'student';
  profile_photo_url?: string;
}

interface Module {
  id: string;
  week: number;
  topic: string;
  description: string;
  steps: any[];
  is_visible: boolean;
  is_locked: boolean;
  lkpd_url?: string;
  lkpd_title?: string;
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
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Management States
  const [searchQuery, setSearchQuery] = useState('');
  const [editingModule, setEditingModule] = useState<Partial<Module> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        supabase.from('profiles').select('*').order('nama'),
        supabase.from('modules').select('*').order('week'),
      ]);

      setProfiles(pRes.data || []);
      setModules(mRes.data || []);

      const studentCount = pRes.data?.filter(p => p.role === 'student').length || 0;
      const teacherCount = pRes.data?.filter(p => p.role === 'teacher').length || 0;
      const moduleCount = mRes.data?.length || 0;

      setStats([
        { label: 'Mahasiswa', value: studentCount, icon: Users, color: 'bg-blue-500' },
        { label: 'Guru/Dosen', value: teacherCount, icon: ShieldCheck, color: 'bg-indigo-500' },
        { label: 'Total Modul', value: moduleCount, icon: BookOpen, color: 'bg-emerald-500' },
        { label: 'Sistem Health', value: '100%', icon: Sparkles, color: 'bg-amber-500' },
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
        week: editingModule.week || 1,
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

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'modules', label: 'Manajemen Modul', icon: BookOpen },
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
            <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">{activeSection}</h2>
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
                         <p className="text-slate-500 leading-relaxed max-w-2xl mb-8">Gunakan panel ini untuk mengelola modul pembelajaran dan status pengguna. Semua perubahan yang Anda lakukan akan langsung tersinkronisasi ke seluruh platform dalam hitungan detik.</p>
                         <button onClick={() => setActiveSection('modules')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">Mulai Kelola Modul</button>
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
                        onClick={() => setEditingModule({ topic: '', steps: [], week: modules.length + 1 })}
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
                               {m.week}
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
            className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
           >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingModule.id ? 'Edit Modul' : 'Tambah Modul Baru'}</h3>
                  <p className="text-sm text-slate-400 font-medium">Isi detail modul dan langkah pembelajarannya.</p>
                </div>
                <button onClick={() => setEditingModule(null)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="md:col-span-1">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Urutan / Minggu</label>
                     <input 
                      type="number" 
                      value={editingModule.week}
                      onChange={e => setEditingModule({...editingModule, week: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                     />
                   </div>
                   <div className="md:col-span-3">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Topik / Judul Modul</label>
                     <input 
                      type="text" 
                      value={editingModule.topic}
                      onChange={e => setEditingModule({...editingModule, topic: e.target.value})}
                      placeholder="Contoh: Pengantar Kinematika"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                     />
                   </div>
                   <div className="md:col-span-4">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Deskripsi Singkat</label>
                     <textarea 
                      value={editingModule.description}
                      onChange={e => setEditingModule({...editingModule, description: e.target.value})}
                      placeholder="Ringkasan materi yang akan dipelajari..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                     />
                   </div>
                </div>

                {/* LKPD Section */}
                <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50 space-y-6">
                  <h4 className="flex items-center gap-3 text-blue-700 font-black uppercase tracking-widest text-xs">
                    <FileText size={18} /> Pengaturan LKPD (Download)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input 
                      type="text" 
                      placeholder="Judul LKPD (Contoh: LKPD-1 Gerak Lurus)"
                      value={editingModule.lkpd_title || ''}
                      onChange={e => setEditingModule({...editingModule, lkpd_title: e.target.value})}
                      className="bg-white border border-blue-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                     <div className="flex gap-2">
                       <input 
                        type="text" 
                        placeholder="Link File (Google Drive / URL)"
                        value={editingModule.lkpd_url || ''}
                        onChange={e => setEditingModule({...editingModule, lkpd_url: e.target.value})}
                        className="flex-1 bg-white border border-blue-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                       <button className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shrink-0">
                         <Upload size={20} />
                       </button>
                     </div>
                  </div>
                </div>

                {/* Steps Builder */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                     <h4 className="font-black text-slate-800 text-xl tracking-tight">Langkah Pembelajaran ({editingModule.steps?.length || 0})</h4>
                     <button 
                      onClick={() => {
                        const newSteps = [...(editingModule.steps || []), { title: '', type: 'pdf', url: '', instruction: '' }];
                        setEditingModule({...editingModule, steps: newSteps});
                      }}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                     >
                        Tambah Langkah
                     </button>
                   </div>

                   <div className="space-y-4">
                      {editingModule.steps?.map((step, sIdx) => (
                        <div key={sIdx} className="bg-slate-50 p-6 rounded-3xl border border-slate-200/50 space-y-4 relative group">
                           <button 
                            onClick={() => {
                              const newSteps = editingModule.steps?.filter((_, i) => i !== sIdx);
                              setEditingModule({...editingModule, steps: newSteps});
                            }}
                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"
                           >
                             <Trash2 size={16} />
                           </button>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Judul Langkah</label>
                                <input 
                                  type="text" 
                                  value={step.title}
                                  onChange={e => {
                                    const newSteps = [...(editingModule.steps || [])];
                                    newSteps[sIdx].title = e.target.value;
                                    setEditingModule({...editingModule, steps: newSteps});
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Tipe Konten</label>
                                <select 
                                  value={step.type}
                                  onChange={e => {
                                    const newSteps = [...(editingModule.steps || [])];
                                    newSteps[sIdx].type = e.target.value;
                                    setEditingModule({...editingModule, steps: newSteps});
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold uppercase"
                                >
                                  <option value="ppt">PowerPoint</option>
                                  <option value="pdf">PDF Viewer</option>
                                  <option value="video">Video (YT)</option>
                                  <option value="phet">PhET Simulasi</option>
                                  <option value="refleksi">Refleksi</option>
                                  <option value="link">External Link</option>
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">URL / Sumber Konten</label>
                                <input 
                                  type="text" 
                                  value={step.url}
                                  onChange={e => {
                                    const newSteps = [...(editingModule.steps || [])];
                                    newSteps[sIdx].url = e.target.value;
                                    setEditingModule({...editingModule, steps: newSteps});
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-blue-600"
                                  placeholder="Link YouTube, PDF, atau Simulasi..."
                                />
                              </div>
                           </div>
                        </div>
                      ))}
                      
                      {(!editingModule.steps || editingModule.steps.length === 0) && (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                           <List size={40} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-slate-400 font-medium">Belum ada langkah pembelajaran.</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-4 bg-slate-50/50">
                <button 
                  onClick={() => setEditingModule(null)}
                  className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveModule}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Simpan Modul
                </button>
              </div>
           </motion.div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}
