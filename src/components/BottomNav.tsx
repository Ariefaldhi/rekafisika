import { NavLink } from 'react-router-dom';
import { Home, Compass, MoreHorizontal } from 'lucide-react';

const navItems = [
  { to: '/home', icon: Home, label: 'Beranda' },
  { to: '/modul', icon: Compass, label: 'Jelajah' },
  { to: '/lainnya', icon: MoreHorizontal, label: 'Lainnya' },
];

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 w-full px-6 pb-6 pt-10 pointer-events-none z-50">
      <nav className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-slate-200 py-3 px-8 flex justify-between items-center shadow-2xl rounded-3xl pointer-events-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-primary-500' : 'text-slate-400 hover:text-primary-500'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-bold">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
