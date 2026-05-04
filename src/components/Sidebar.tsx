import { NavLink, Link } from 'react-router-dom';
import { Home, Compass, MoreHorizontal, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logoUrl from '/logo.png';

const navItems = [
  { to: '/home', icon: Home, label: 'Beranda' },
  { to: '/modul', icon: Compass, label: 'Jelajah Materi' },
  { to: '/lainnya', icon: MoreHorizontal, label: 'Informasi Lain' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white border-r border-slate-200 p-8">
      {/* Logo */}
      <Link to="/home" className="flex items-center gap-3 mb-12 px-2">
        <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
        <h1 className="text-xl font-black text-slate-900 tracking-tight">RekaFisika</h1>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Menu Utama</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                isActive 
                  ? 'bg-primary-50 text-primary-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all mt-8 ${
                isActive 
                  ? 'bg-rose-50 text-rose-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-rose-50 hover:text-rose-700'
              }`
            }
          >
            <Shield size={20} />
            <span className="text-sm">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      {/* User & Logout */}
      <div className="pt-8 border-t border-slate-100">
        <Link to="/profil" className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-2xl transition-all mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
             {user?.nama?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">{user?.nama || 'Pengguna'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Lihat Profil</p>
          </div>
        </Link>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all"
        >
          <LogOut size={20} />
          <span className="text-sm">Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
