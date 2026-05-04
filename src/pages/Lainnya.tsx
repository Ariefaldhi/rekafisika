import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, LogOut, BookOpen, FolderOpen,
  HelpCircle, TrendingUp, ShieldCheck, Camera, Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAuth } from '../hooks/useAuth';

export default function Lainnya() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const initials = user?.nama
    ? user.nama.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/', { replace: true });
  };

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
      // Resize & compress via canvas
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

  const menuItems = [
    { to: '/buku', icon: <BookOpen size={22} className="text-blue-600" />, bg: 'bg-blue-100', label: 'Referensi' },
    { to: '/bank-soal', icon: <FolderOpen size={22} className="text-purple-600" />, bg: 'bg-purple-100', label: 'Bank Soal' },
    { to: '/panduan', icon: <HelpCircle size={22} className="text-slate-600" />, bg: 'bg-slate-100', label: 'Panduan' },
    ...(user?.role === 'teacher' || user?.role === 'admin'
      ? [{ to: '/hasil-ajar', icon: <TrendingUp size={22} className="text-emerald-600" />, bg: 'bg-emerald-100', label: 'Hasil Ajar' }]
      : []),
    ...(user?.role === 'admin'
      ? [{ to: '/admin', icon: <ShieldCheck size={22} className="text-white" />, bg: 'bg-slate-800', label: 'Admin Panel', dark: true }]
      : []),
  ];

  return (
    <div className="bg-slate-50 font-[Inter,sans-serif] text-slate-800 min-h-screen pb-28 selection:bg-blue-500/30 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-12 pb-6 bg-white sticky top-0 z-40 shadow-sm"
      >
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Menu Lainnya</h1>
        <p className="text-sm text-slate-500 mt-1">Akses semua fitur lainnya disini.</p>
      </motion.div>

      <div className="w-full px-6 lg:px-12 py-8 space-y-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Link
            to="/profil"
            className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors col-span-2"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                {user?.profile_photo_url ? (
                  <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="avatar" />
                ) : initials}
              </div>
              <button
                onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-blue-600 transition-colors"
              >
                {uploadingPhoto ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={10} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate">{user?.nama || 'Pengguna'}</h3>
              <p className="text-xs text-slate-400 truncate">{user?.email || user?.nim}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300 shrink-0" />
          </Link>
        </motion.div>

        {/* Teaching Code */}
        {user?.teaching_code && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kode Pengajaran Guru</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900 text-white font-mono text-2xl tracking-[0.5em] text-center py-3 rounded-2xl">
                {user.teaching_code}
              </div>
              <button
                onClick={copyCode}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  copied ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Copy size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              {copied ? '✅ Kode berhasil disalin!' : 'Bagikan kode ini ke siswa untuk join sesi'}
            </p>
          </motion.div>
        )}

        {/* Menu Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {menuItems.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className={`p-5 rounded-3xl shadow-sm border flex flex-col items-center gap-3 hover:-translate-y-1 transition-transform ${
                item.dark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg}`}>
                {item.icon}
              </div>
              <span className={`font-bold text-sm ${item.dark ? 'text-white' : 'text-slate-700'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3.5 rounded-2xl bg-red-50 text-red-500 font-bold text-sm border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Keluar Aplikasi
            </button>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-600 text-center">Yakin ingin keluar?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-slate-500 font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
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
          <p className="text-center text-xs text-slate-300 mt-6">Versi 3.0.0 (React + TypeScript)</p>
        </motion.div>
      </div>

      </div>
    </div>
  );
}
