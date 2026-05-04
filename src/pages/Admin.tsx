import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ListTodo, BookOpen, Megaphone, Users, Star, 
  QrCode, LineChart, Shield, Settings, LogOut, Search, 
  Trash2, X, ChevronRight, Menu, Loader2,
  ShieldCheck, AlertTriangle
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
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: teacherCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
      const { count: moduleCount } = await supabase.from('modules').select('*', { count: 'exact', head: true });
      const { count: assignmentCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true });

      setStats([
        { label: 'Mahasiswa', value: studentCount || 0, icon: Users, color: 'bg-blue-500' },
        { label: 'Dosen/Guru', value: teacherCount || 0, icon: Shield, color: 'bg-indigo-500' },
        { label: 'Modul Ajar', value: moduleCount || 0, icon: BookOpen, color: 'bg-emerald-500' },
        { label: 'Tugas Aktif', value: assignmentCount || 0, icon: ListTodo, color: 'bg-orange-500' },
      ]);

      // Fetch profiles for management
      const { data: profileData } = await supabase.from('profiles').select('*').order('nama');
      setProfiles(profileData || []);

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

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tugas', icon: ListTodo },
    { id: 'modules', label: 'Modul', icon: BookOpen },
    { id: 'news', label: 'Pengumuman', icon: Megaphone },
    { id: 'students', label: 'Mahasiswa', icon: Users },
    { id: 'points', label: 'Poin Keaktifan', icon: Star },
    { id: 'presence', label: 'Presensi', icon: QrCode },
    { id: 'progress', label: 'Progress', icon: LineChart },
    { id: 'users', label: 'Manajemen User', icon: UserShield },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
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
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black shadow-lg shadow-primary-500/20">A</div>
            <span className="font-black text-slate-800 text-lg">Admin Panel</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Utama</p>
          {navItems.slice(0, 4).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all
                ${activeSection === item.id ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
              `}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
              {activeSection === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}

          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8 mb-4">Manajemen</p>
          {navItems.slice(4).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all
                ${activeSection === item.id ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
              `}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
              {activeSection === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm">Keluar Panel</span>
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
            <h2 className="text-xl font-black text-slate-800 capitalize">{activeSection}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl text-slate-500 text-xs font-bold">
              <ShieldCheck size={14} className="text-primary-500" />
              Super Admin
            </div>
            <img src={user?.profile_photo_url || 'https://i.pravatar.cc/100'} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-md" alt="Avatar" />
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
                {/* --- SECTIONS --- */}

                {activeSection === 'dashboard' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                          <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                          </div>
                          <h3 className="text-4xl font-black text-slate-900 mb-1">{stat.value}</h3>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="font-black text-slate-800">Aktivitas Terbaru</h3>
                          <button className="text-xs font-bold text-primary-500 hover:underline">Lihat Semua</button>
                        </div>
                        <div className="space-y-6">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 group">
                              <div className="w-2 h-2 rounded-full bg-primary-500 group-hover:scale-150 transition-transform" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700">Mahasiswa Baru Terdaftar</p>
                                <p className="text-[10px] text-slate-400">2 menit yang lalu</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-300" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                          <ShieldCheck size={40} className="text-primary-400 mb-6" />
                          <h3 className="text-2xl font-black mb-2">Status Sistem Aman</h3>
                          <p className="text-slate-400 text-sm leading-relaxed mb-8">Semua layanan Supabase dan Realtime berjalan normal. Tidak ada kendala akses terdeteksi.</p>
                          <button className="px-6 py-3 bg-primary-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-500 transition-colors">Cek Infrastruktur</button>
                        </div>
                        <AlertTriangle size={200} className="absolute -right-20 -bottom-20 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'users' && (
                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                          <h3 className="text-2xl font-black text-slate-800">Manajemen Pengguna</h3>
                          <p className="text-slate-400 text-sm mt-1">Total {profiles.length} pengguna terdaftar</p>
                        </div>
                        <div className="relative w-full md:w-80">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            placeholder="Cari nama atau NIM..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                          <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-6 pb-2">Profil & NIM</th>
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
                                    <img src={p.profile_photo_url || `https://ui-avatars.com/api/?name=${p.nama}&background=random`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                    <div>
                                      <p className="text-sm font-black text-slate-800">{p.nama}</p>
                                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{p.nim}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 border-y border-slate-100 group-hover:bg-slate-50 transition-colors">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    p.role === 'admin' ? 'bg-rose-100 text-rose-600' : 
                                    p.role === 'teacher' ? 'bg-indigo-100 text-indigo-600' : 
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {p.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 border-y border-slate-100 group-hover:bg-slate-50 transition-colors">
                                  <select 
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
                                    value={p.role}
                                    onChange={(e) => updateUserRole(p.id, e.target.value)}
                                  >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 rounded-r-3xl border-y border-r border-slate-100 text-right group-hover:bg-slate-50 transition-colors">
                                  <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 size={18} />
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

                {/* Placeholder for other sections */}
                {!['dashboard', 'users'].includes(activeSection) && (
                  <div className="bg-white p-20 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <LayoutDashboard size={64} className="mx-auto text-slate-200 mb-6" />
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Halaman Sedang Dimigrasi</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">Section <span className="font-bold text-primary-500">{activeSection}</span> sedang dalam proses konversi ke React TypeScript. Silakan cek kembali nanti.</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}

