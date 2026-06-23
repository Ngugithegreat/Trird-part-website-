'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useStore } from '@/store/useStore';
import { useDerivWS } from '@/hooks/useDerivWS';
import { SYMBOLS } from '@/lib/deriv';
import { 
  LayoutDashboard, TrendingUp, Bot, Layers, Zap, Gift, Users, Search, Rocket, Settings, Bell, LogOut, ChevronLeft, ChevronRight, Menu 
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: TrendingUp, label: 'Manual Trader', href: '/dashboard/trade' },
  { icon: Zap, label: 'Live Signals', href: '/dashboard/signals' },
  { icon: Bot, label: 'Bot Builder', href: '/dashboard/bots' },
  { icon: Layers, label: 'Bulk Trader', href: '/dashboard/bulk-trader' },
  { icon: Rocket, label: 'Apex Bot', href: '/dashboard/apex-bot' },
  { icon: Gift, label: 'Free Bots', href: '/dashboard/free-bots' },
  { icon: Users, label: 'Copy Trader', href: '/dashboard/copy-trader' },
  { icon: Search, label: 'Analysis Tools', href: '/dashboard/analysis' },
  { icon: Rocket, label: 'Speedbot', href: '/dashboard/speedbot' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { auth, clearAuth, connected, allTicks } = useStore();
  
  useDerivWS();

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#080b12] overflow-hidden text-[#e8eaf0]">
        
        {/* Top Navbar */}
        <header className="fixed top-0 left-0 right-0 h-14 z-[100] bg-[#080b12]/95 backdrop-blur-2xl border-b border-white/5 flex items-center px-4 justify-between">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00e676] to-[#2979ff] rounded flex items-center justify-center font-black text-black">N</div>
            <span className="font-bold text-sm tracking-tight hidden md:block">NairobiForexTraders</span>
            <div className={`w-1.5 h-1.5 rounded-full ml-2 ${connected ? 'bg-[#00e676] animate-pulse shadow-[0_0_8px_#00e676]' : 'bg-[#ff1744]'}`} />
          </div>

          <div className="flex-1 overflow-hidden px-8">
            <div className="flex items-center gap-12 whitespace-nowrap animate-ticker">
              {[...SYMBOLS, ...SYMBOLS].map((s, i) => (
                <div key={i} className="flex items-center gap-2 font-tabular">
                  <span className="text-[10px] font-bold text-[#8892a4]">{s.short}</span>
                  <span className="text-xs font-bold text-white">{allTicks[s.id]?.toFixed(s.pip) || '---'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#151d2e] rounded-full border border-white/5 font-tabular">
              <span className="text-[#00e676] font-bold text-xs">
                {auth?.currency} {auth?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button className="p-2 text-[#8892a4] hover:text-white transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#ff1744] rounded-full" />
            </button>
            <div className="w-8 h-8 bg-[#1c2640] rounded-full flex items-center justify-center font-bold text-xs text-[#e8eaf0]">
              {auth?.fullname?.charAt(0) || 'U'}
            </div>
            <button onClick={handleLogout} className="p-2 text-[#8892a4] hover:text-[#ff1744] transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sidebar */}
        <aside className={`${collapsed ? 'w-16' : 'w-56'} h-full pt-14 border-r border-white/5 bg-[#0e1420] transition-all duration-300 flex flex-col z-[90]`}>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`
                    flex items-center h-10 px-3 rounded-lg transition-all group relative
                    ${isActive ? 'bg-[#00e676]/10 text-[#00e676] border-l-2 border-[#00e676]' : 'text-[#8892a4] hover:text-white hover:bg-white/5'}
                  `}>
                    <item.icon className={`w-4 h-4 shrink-0 ${!collapsed && 'mr-3'}`} />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="p-2 border-t border-white/5">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center h-10 rounded-lg text-[#8892a4] hover:bg-white/5 transition-all"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-14 overflow-y-auto bg-[#080b12] relative scrollbar-none">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
