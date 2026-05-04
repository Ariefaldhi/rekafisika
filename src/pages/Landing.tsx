import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Radio, FlaskConical, ShieldCheck, ArrowRight, Key } from 'lucide-react';
import logoUrl from '/logo.png';

export default function Landing() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      color: 'bg-blue-500/10 text-blue-400',
      title: 'Teacher-Paced Mode',
      desc: 'Sinkronisasi Realtime. Saat guru pindah halaman, layar seluruh HP siswa di kelas akan ikut berpindah dalam kedipan mata.',
    },
    {
      icon: <FlaskConical size={24} />,
      color: 'bg-emerald-500/10 text-emerald-400',
      title: 'LKPD Cerdas Terpadu',
      desc: 'Siswa dapat memasukkan jawaban langsung di halaman materi. Semua jawaban langsung terekam dan ternilai otomatis ke dashboard guru.',
    },
    {
      icon: <ShieldCheck size={24} />,
      color: 'bg-purple-500/10 text-purple-400',
      title: 'Mode Tamu Anti Hilang',
      desc: 'Siswa tidak perlu daftar ribet. Cukup masukkan kode ruang tunggu dari guru, dan siswa tak bisa keluyuran selama sesi belum ditutup.',
    },
  ];

  return (
    <div className="font-[Inter,sans-serif] text-slate-100 antialiased min-h-screen overflow-x-hidden selection:bg-blue-500/30 bg-[#060813] relative">
      
      {/* ── Organic Blobs ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[80px]" />
        
        {/* SVG Waves/Blobs for that fluid look */}
        <svg className="absolute top-0 right-0 w-full h-full opacity-20" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#4f46e5', stopOpacity: 0.2 }} />
            </linearGradient>
          </defs>
          <path d="M784.5,604.5Q688,709,563,744.5Q438,780,317,719.5Q196,659,165.5,529.5Q135,400,230,305.5Q325,211,463.5,170.5Q602,130,691.5,233.5Q781,337,831,470.5Q881,604,784.5,604.5Z" fill="url(#grad1)" transform="translate(100, -100) rotate(15)" />
        </svg>
      </div>

      {/* ── Navbar ── */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#060813]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="RekaFisika" className="w-10 h-10 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3242/3242120.png'; }} />
            <span className="text-2xl font-black tracking-tight text-white">RekaFisika</span>
          </div>

          <div className="hidden md:flex gap-10 items-center font-bold text-xs uppercase tracking-[0.2em] text-slate-400">
            <a href="#fitur" className="hover:text-blue-400 transition-colors">Fitur</a>
            <a href="#tentang" className="hover:text-blue-400 transition-colors">Tentang</a>
            <Link
              to="/login"
              className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 pt-32 pb-20 lg:pt-56 lg:pb-32 px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-10"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-white">
              Eksplorasi Fisika<br />
              <span className="text-blue-500">Secara Interaktif.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed font-medium">
              <strong className="text-white">Media Interaktif Fisika berbasis website untuk Membantu Guru.</strong>{' '}
              Tinggalkan metode ceramah satu arah. Buka ruang kelas digital dengan sinkronisasi layar seketika,
              lembar kerja pintar, dan visualisasi rumus yang hidup.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              {/* Code Join Form integrated as primary action */}
              <div className="relative group min-w-[320px]">
                <Key size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="w-full bg-white/5 border border-white/10 text-white font-black tracking-[0.3em] uppercase rounded-2xl py-5 pl-16 pr-6 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-xl backdrop-blur-xl"
                  placeholder="KODE GURU"
                />
                {error && <p className="absolute -bottom-6 left-2 text-rose-500 text-[10px] font-bold uppercase">{error}</p>}
              </div>
              
              <button
                onClick={handleJoin}
                className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20"
              >
                Try Now <ArrowRight size={18} />
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-2">
              Punya kode 6 digit dari guru? Masukkan di atas untuk langsung belajar.
            </p>
          </motion.div>

        </div>
      </main>

      {/* ── Features ── */}
      <section id="fitur" className="py-32 relative z-20">
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-none">Masa Depan<br/>Belajar Fisika.</h2>
            <p className="text-slate-500 max-w-md font-medium">Dirancang khusus untuk memecahkan kebosanan dan kerumitan konsep di dalam ruang kelas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-10 rounded-[3rem] bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group backdrop-blur-sm"
              >
                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <footer id="tentang" className="py-24 relative z-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 text-center">
          <div className="max-w-3xl mx-auto space-y-10">
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">Siap Membantu<br/>Kelasmu?</h2>
            <p className="text-slate-400 max-w-lg mx-auto font-medium text-lg leading-relaxed">
              Bergabung dengan RekaFisika dan permudah administrasi serta pemahaman praktikum alat peraga di sekolah Anda.
            </p>
            <Link
              to="/login"
              className="inline-block px-12 py-6 bg-white text-slate-900 font-black rounded-2xl hover:scale-105 hover:bg-slate-100 transition-all uppercase tracking-[0.2em] text-xs shadow-2xl shadow-white/10"
            >
              Daftar Sebagai Pengajar
            </Link>

            <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 gap-8">
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="RekaFisika" className="w-6 h-6 grayscale opacity-20" />
                <span className="text-slate-400">RekaFisika</span> &copy; 2026. Hak Cipta Dilindungi.
              </div>
              <div className="flex gap-8">
                 <a href="#" className="hover:text-white transition-colors">Privacy</a>
                 <a href="#" className="hover:text-white transition-colors">Terms</a>
                 <a href="#" className="hover:text-white transition-colors">Github</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

