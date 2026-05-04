import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Radio, FlaskConical, ShieldCheck, ArrowRight, Key } from 'lucide-react';
import logoUrl from '/logo.png';

export default function Landing() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Kode wajib berjumlah 6 digit karakter!');
      inputRef.current?.focus();
      return;
    }
    navigate(`/login?mode=code&kode=${trimmed}`);
  };

  const features = [
    {
      icon: <Radio size={24} />,
      color: 'bg-blue-100 text-blue-600',
      title: 'Teacher-Paced Mode',
      desc: 'Sinkronisasi Realtime. Saat guru pindah halaman, layar seluruh HP siswa di kelas akan ikut berpindah dalam kedipan mata.',
    },
    {
      icon: <FlaskConical size={24} />,
      color: 'bg-emerald-100 text-emerald-600',
      title: 'LKPD Cerdas Terpadu',
      desc: 'Siswa dapat memasukkan jawaban langsung di halaman materi. Semua jawaban langsung terekam dan ternilai otomatis ke dashboard guru.',
    },
    {
      icon: <ShieldCheck size={24} />,
      color: 'bg-purple-100 text-purple-600',
      title: 'Mode Tamu Anti Hilang',
      desc: 'Siswa tidak perlu daftar ribet. Cukup masukkan kode ruang tunggu dari guru, dan siswa tak bisa keluyuran selama sesi belum ditutup.',
    },
  ];

  return (
    <div className="font-[Inter,sans-serif] text-slate-800 antialiased min-h-screen overflow-x-hidden selection:bg-blue-500/30"
      style={{ background: 'radial-gradient(circle at top right, #e0e7ff 0%, #f8fafc 40%, #f1f5f9 100%)' }}>

      {/* ── Navbar ── */}
      <nav className="fixed w-full z-50 transition-all duration-300"
        style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="RekaFisika" className="w-9 h-9 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3242/3242120.png'; }} />
            <span className="text-2xl font-black tracking-tight text-slate-900">RekaFisika</span>
          </div>

          <div className="hidden md:flex gap-8 items-center font-medium text-slate-600">
            <a href="#fitur" className="hover:text-blue-600 transition-colors">Fitur</a>
            <a href="#tentang" className="hover:text-blue-600 transition-colors">Cara Kerja</a>
          </div>

          <Link
            to="/login"
            className="px-6 py-2.5 rounded-full font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            Masuk Akun
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-40 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-8 shadow-sm">
              <Zap size={12} className="text-yellow-500" /> Platform Belajar Generasi Baru
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              Eksplorasi Dunia Fisika<br />
              <span style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Secara Interaktif
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              <strong className="text-slate-800">Media Interaktif Fisika berbasis website untuk Membantu Guru.</strong>{' '}
              Tinggalkan metode ceramah satu arah. Buka ruang kelas digital dengan sinkronisasi layar seketika,
              lembar kerja pintar, dan visualisasi rumus yang hidup.
            </p>
          </motion.div>

          {/* Code Join Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl mx-auto p-4 md:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-4 items-center"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}
          >
            <div className="flex-1 w-full relative">
              <Key size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-center font-bold tracking-[0.4em] uppercase rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xl"
                placeholder="KODE GURU"
              />
            </div>
            <button
              onClick={handleJoin}
              className="w-full md:w-auto px-8 py-4 bg-slate-900 border border-slate-700 text-white font-bold rounded-2xl hover:bg-slate-800 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/20 text-center transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Gabung Kelas <ArrowRight size={16} />
            </button>
          </motion.div>
          {error && <p className="text-red-500 text-sm mt-3 font-medium">{error}</p>}
          <p className="text-xs text-slate-400 mt-4">
            Punya kode 6 digit dari guru? Masukkan di atas untuk langsung belajar.
          </p>
        </div>
      </main>

      {/* ── Features ── */}
      <section id="fitur" className="py-24 bg-white relative z-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Masa Depan Belajar Fisika</h2>
            <p className="text-slate-500">Dirancang khusus untuk memecahkan kebosanan dan kerumitan konsep di dalam ruang kelas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <footer id="tentang" className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-6">Siap Membantu Kelasmu?</h2>
          <p className="mb-8 max-w-lg mx-auto">
            Bergabung dengan RekaFisika dan permudah administrasi serta pemahaman praktikum alat peraga di sekolah Anda.
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
          >
            Daftar Sebagai Pengajar
          </Link>

          <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs gap-4">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="RekaFisika" className="w-5 h-5 opacity-50 grayscale" />
              <span className="font-bold text-slate-300">RekaFisika</span> &copy; 2026. Hak Cipta Dilindungi.
            </div>
            <div>A Platform For Education.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
