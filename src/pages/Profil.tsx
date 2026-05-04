import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, LogOut, Camera, Copy, GraduationCap, 
  Calendar, Layers, FileCheck, UserCircle, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function Profil() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  
  // Real Stats
  const [stats, setStats] = useState({
    createdAt: '—',
    sessions: 0,
    results: 0,
    role: '—'
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const initials = user?.nama
    ? user.nama.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  useEffect(() => {
    if (user) {
      fetchRealStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchRealStats() {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      // 1. Created At
      const createdDate = user.created_at 
        ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

      // 2. Results Count (from reflection_answers for this teacher's code)
      let resultsCount = 0;
      if (user.teaching_code) {
        const { count } = await supabase
          .from('reflection_answers')
          .select('*', { count: 'exact', head: true })
          .eq('teaching_code', user.teaching_code);
        resultsCount = count || 0;
      }

      // 3. Sessions Count (Approximate by unique module_id/group in results)
      let sessionsCount = 0;
      if (user.teaching_code) {
        const { data } = await supabase
          .from('reflection_answers')
          .select('module_id, group_name')
          .eq('teaching_code', user.teaching_code);
        
        // Count unique combinations of module + group
        const uniqueSessions = new Set(data?.map(d => `${d.module_id}-${d.group_name}`));
        sessionsCount = uniqueSessions.size;
      }

      setStats({
        createdAt: createdDate,
        sessions: sessionsCount,
        results: resultsCount,
        role: user.role === 'admin' ? 'Administrator' : user.role === 'teacher' ? 'Guru' : 'Siswa'
      });
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setIsLoadingStats(false);
    }
  }

  const copyCode = () => {
    if (user?.teaching_code) {
      navigator.clipboard.writeText(user.teaching_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d')!;
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, 300, 300);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);

        try {
          await supabase.from('students').update({ profile_photo_url: compressed }).eq('nim', user.nim);
          login({ ...user, profile_photo_url: compressed });
        } catch (err) {
          console.error('Photo upload failed', err);
        } finally {
          setUploadingPhoto(false);
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-slate-50 font-[Inter,sans-serif] text-slate-800 min-h-screen pb-28 selection:bg-blue-500/30 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-12 pb-6 bg-white shadow-sm mb-4 flex items-center gap-4"
      >
        <Link
          to="/lainnya"
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profil Saya</h1>
      </motion.div>

      <main className="w-full px-6 lg:px-12 py-8 space-y-8">
        {/* Avatar + Name Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full bg-slate-100 overflow-hidden border-4 border-slate-50 shadow-md flex items-center justify-center text-4xl font-bold text-slate-300">
              {user?.profile_photo_url ? (
                <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="avatar" />
              ) : initials}
            </div>
            <div className="absolute bottom-1 right-1 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow group-hover:scale-110 transition-transform">
              {uploadingPhoto
                ? <Loader2 size={16} className="animate-spin" />
                : <Camera size={16} />
              }
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">{user?.nama || 'Tamu'}</h2>
          <p className="text-slate-400 text-sm font-medium mb-4">{user?.email || user?.nim || 'Belum Login'}</p>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${
            user?.role === 'admin'
              ? 'bg-slate-900 text-white'
              : 'bg-primary-100 text-primary-600'
          }`}>
            {stats.role}
          </span>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-10">
            <StatCard 
              icon={<Calendar size={18} className="text-blue-600" />} 
              bg="bg-blue-50" 
              label="Akun Dibuat" 
              value={stats.createdAt} 
              isLoading={isLoadingStats}
            />
            <StatCard 
              icon={<Layers size={18} className="text-indigo-600" />} 
              bg="bg-indigo-50" 
              label="Sesi Dijalankan" 
              value={`${stats.sessions} Sesi`} 
              isLoading={isLoadingStats}
            />
            <StatCard 
              icon={<FileCheck size={18} className="text-emerald-600" />} 
              bg="bg-emerald-50" 
              label="Hasil Ajar Masuk" 
              value={`${stats.results} Data`} 
              isLoading={isLoadingStats}
            />
            <StatCard 
              icon={<UserCircle size={18} className="text-purple-600" />} 
              bg="bg-purple-50" 
              label="Role Pengguna" 
              value={user?.role?.toUpperCase() || '—'} 
              isLoading={isLoadingStats}
            />
          </div>
        </motion.div>

        {/* Teacher Settings */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Pengaturan Pengajaran</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Kunci Akses Guru</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Kode Pengajaran Aktif</label>
              <div className="flex gap-3">
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-lg font-black tracking-[0.5em] text-center uppercase text-primary-600 shadow-inner">
                  {user?.teaching_code || '------'}
                </div>
                <button
                  onClick={copyCode}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-sm ${
                    copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {copied ? <FileCheck size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                {copied ? 'Kode berhasil disalin ke clipboard!' : 'Gunakan kode ini agar siswa terhubung ke sesi Anda.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Logout Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden"
        >
          {!showLogout ? (
            <button
              onClick={() => setShowLogout(true)}
              className="w-full flex items-center justify-between p-6 hover:bg-rose-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <LogOut size={20} />
                </div>
                <div className="text-left">
                  <h4 className="font-black text-slate-800">Keluar Aplikasi</h4>
                  <p className="text-xs text-slate-400 font-medium">Selesaikan sesi aktif Anda</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ) : (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <LogOut size={32} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">Yakin ingin keluar?</p>
                <p className="text-sm text-slate-400">Anda harus login kembali untuk mengakses materi.</p>
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          )}
        </motion.div>

        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest pb-12">RekaFisika Platform • v3.1.0</p>
      </main>
    </div>
  );
}

function StatCard({
  icon, bg, label, value, isLoading
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>{icon}</div>
        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{label}</h4>
      </div>
      {isLoading ? (
        <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
      ) : (
        <span className="text-xl font-black text-slate-800 tracking-tight">{value}</span>
      )}
    </div>
  );
}

const ChevronRight = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
