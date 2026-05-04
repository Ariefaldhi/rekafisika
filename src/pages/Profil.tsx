import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Camera, Copy, GraduationCap, ClipboardCheck, HandMetal, ListChecks, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAuth } from '../hooks/useAuth';

export default function Profil() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const initials = user?.nama
    ? user.nama.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

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
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
            <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden border-4 border-slate-50 shadow-md flex items-center justify-center text-4xl font-bold text-slate-300">
              {user?.profile_photo_url ? (
                <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="avatar" />
              ) : initials}
            </div>
            <div className="absolute bottom-1 right-0 w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow group-hover:scale-110 transition-transform">
              {uploadingPhoto
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={14} />
              }
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <h2 className="text-xl font-bold text-slate-900">{user?.nama || 'Tamu'}</h2>
          <p className="text-slate-400 text-sm font-mono mb-1">{user?.email || user?.nim || 'Belum Login'}</p>
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
            user?.role === 'admin'
              ? 'bg-slate-900 text-white'
              : 'bg-blue-100 text-blue-600'
          }`}>
            {user?.role === 'admin' ? 'Administrator' : user?.role === 'teacher' ? 'Guru' : 'Siswa'}
          </span>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mt-6 text-left">
            <StatCard icon={<ClipboardCheck size={16} className="text-emerald-600" />} bg="bg-emerald-100" label="Kehadiran" value="—" bar />
            <StatCard icon={<HandMetal size={16} className="text-blue-600" />} bg="bg-blue-100" label="Partisipasi" value="0 Poin" />
            <StatCard icon={<ListChecks size={16} className="text-purple-600" />} bg="bg-purple-100" label="Tugas" value="0/0" bar />
            <StatCard icon={<Flame size={16} className="text-orange-600" />} bg="bg-orange-100" label="Kerajinan" value="0 Poin" />
          </div>
        </motion.div>

        {/* Teacher Settings */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Pengaturan Pengajaran</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Khusus Akun Guru</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Kode Pengajaran (6-Digit)</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black tracking-[0.5em] text-center uppercase text-blue-600">
                  {user?.teaching_code || '------'}
                </div>
                <button
                  onClick={copyCode}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    copied ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic leading-relaxed mt-2">
                {copied ? '✅ Kode berhasil disalin!' : 'Kode ini digunakan siswa untuk mengirim hasil belajar mereka langsung ke dashboard Anda.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        >
          {!showLogout ? (
            <button
              onClick={() => setShowLogout(true)}
              className="w-full flex items-center gap-4 p-5 hover:bg-red-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <LogOut size={18} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-red-600">Keluar</h4>
                <p className="text-xs text-red-400">Logout dari akun</p>
              </div>
            </button>
          ) : (
            <div className="p-5 space-y-3">
              <p className="text-sm font-bold text-red-600 text-center">Yakin ingin keluar?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-500 font-bold text-sm border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          )}
        </motion.div>

        <p className="text-center text-xs text-slate-300 pb-4">Versi Aplikasi v3.0.0</p>
      </main>
    </div>
  );
}

function StatCard({
  icon, bg, label, value, bar = false
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  bar?: boolean;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</h4>
      </div>
      <span className="text-2xl font-black text-slate-800">{value}</span>
      {bar && (
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '0%' }} />
        </div>
      )}
    </div>
  );
}
