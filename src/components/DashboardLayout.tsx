import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-[Inter,sans-serif]">
      {/* Sidebar - Desktop Only */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 w-full max-w-7xl mx-auto">
          {children}
        </div>
        
        {/* Mobile Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
