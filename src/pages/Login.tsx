import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Key, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { UserSession } from '../lib/supabase';
import logoUrl from '/logo.png';

type AuthMode = 'login' | 'register' | 'code';

const TABS: { id: AuthMode; label: string }[] = [
  { id: 'login', label: 'Masuk' },
  { id: 'register', label: 'Daftar' },
  { id: 'code', label: 'Kode Guru' },
];

function generateTeachingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [guestCode, setGuestCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/home', { replace: true });
  }, [user, navigate]);

  // Handle ?mode=code&kode=XXXXXX from landing page
  useEffect(() => {
    const urlMode = searchParams.get('mode') as AuthMode | null;
    const urlKode = searchParams.get('kode');
    if (urlMode === 'code') {
      setMode('code');
      if (urlKode) {
        setGuestCode(urlKode.toUpperCase());
        // Auto-submit after short delay
        setTimeout(() => handleCodeLogin(urlKode.toUpperCase()), 400);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = () => setError('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'code') { handleCodeLogin(guestCode); return; }

    setIsLoading(true);
    setError('');

    try {
      // Admin static bypass
      if (mode === 'login' && email === 'admin@rekafisika.com' && password === 'reka2025') {
        login({ role: 'admin', nama: 'Admin Fisika', nim: 'admin' });
        navigate('/admin', { replace: true });
        return;
      }

      if (mode === 'login') {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) {
          if (authErr.status === 400) throw new Error('Email atau password salah.');
          throw authErr;
        }
        if (!data.user) throw new Error('Gagal memuat profil pengguna.');

        const { data: profile } = await supabase
          .from('profiles')
          .select('teaching_code, role, nama, created_at')
          .eq('nim', data.user.email)
          .maybeSingle();

        const meta = data.user.user_metadata || {};
        const session: UserSession = {
          role: (profile?.role as UserSession['role']) || (meta.role as UserSession['role']) || 'teacher',
          nama: profile?.nama || meta.nama || 'Pengguna',
          nim: data.user.email!,
          email: data.user.email,
          teaching_code: profile?.teaching_code ?? null,
          created_at: profile?.created_at ?? data.user.created_at,
        };
        login(session);
        navigate(session.role === 'admin' ? '/admin' : '/home', { replace: true });

      } else {
        // Register
        const { data, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nama: name, role: 'teacher' } },
        });

        if (authErr) {
          if (authErr.status === 422) throw new Error('Password terlalu lemah / Email tidak valid.');
          if (authErr.message.includes('already registered')) throw new Error('Email ini sudah terdaftar.');
          throw authErr;
        }
        if (!data.user) throw new Error('Registrasi gagal.');

        const teachingCode = generateTeachingCode();
        const userEmail = data.user.email!;
        const userId = data.user.id;

        await supabase.from('students').upsert([{
          nim: userEmail, name, role: 'teacher', access_code: null, teaching_code: teachingCode,
        }], { onConflict: 'nim' });

        await supabase.from('profiles').upsert([{
          id: userId, nim: userEmail, nama: name, role: 'teacher', teaching_code: teachingCode,
        }], { onConflict: 'id' });

        login({ role: 'teacher', nama: name, nim: userEmail, email: userEmail, teaching_code: teachingCode });
        navigate('/home', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal tersambung. Periksa koneksi internet.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCodeLogin(code = guestCode) {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) { setError('Masukkan 6 digit kode yang benar.'); return; }

    setIsLoading(true);
    setError('');

    try {
      const { data: teacher, error: teacherErr } = await supabase
        .from('profiles')
        .select('nama, nim, teaching_code')
        .eq('teaching_code', trimmed)
        .eq('role', 'teacher')
        .maybeSingle();

      if (teacherErr) throw teacherErr;
      if (!teacher) throw new Error('Kode tidak ditemukan atau Guru belum mengaktifkan kode ini.');

      const { data: sesi } = await supabase
        .from('sesi_kelas')
        .select('module_id')
        .eq('kode_kelas', trimmed)
        .maybeSingle();

      if (!sesi?.module_id) throw new Error('Guru kamu belum memulai sesi pengajaran. Tunggu instruksi selanjutnya!');

      login({
        is_guest: true,
        role: 'student',
        teaching_code: trimmed,
        nama: `Tamu (${trimmed})`,
        nim: `guest_${trimmed}_${Date.now()}`,
        teacher_name: teacher.nama,
        active_module_id: sesi.module_id,
      });

      navigate(`/detail-modul/${sesi.module_id}`, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal tersambung.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 font-[Inter,sans-serif] min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden"
      >
        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <Link to="/">
            <img src={logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-4 object-contain hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Masuk' : mode === 'register' ? 'Daftar' : 'Siswa Tamu'}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === 'login' ? 'Akses akun RekaFisika Anda' :
              mode === 'register' ? 'Buat akun baru untuk mulai belajar' :
              'Masuk menggunakan Kode Guru Anda'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setMode(tab.id); clearError(); }}
              className={`flex-1 py-3 text-[10px] uppercase font-bold border-b-2 transition-colors ${
                mode === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'code' ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-2">
                  Kode Masuk Guru (6 Digit)
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={guestCode}
                    onChange={(e) => { setGuestCode(e.target.value.toUpperCase()); clearError(); }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700 font-bold tracking-[0.5em] text-center uppercase"
                    placeholder="XXXXXX"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="email-pass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-2">Nama Lengkap</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700"
                        placeholder="Contoh: Budi Santoso"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-2">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700"
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-2">Kata Sandi</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Memproses...</>
            ) : (
              <>
                {mode === 'login' ? 'Masuk' : mode === 'register' ? 'Daftar Akun' : 'Masuk dengan Kode'}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-red-500 text-sm font-medium"
            >
              {error}
            </motion.p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
