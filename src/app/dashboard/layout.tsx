'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useStore } from '@/store/useStore';
import { useDerivWS } from '@/hooks/useDerivWS';
import { SYMBOLS } from '@/lib/deriv';
import AccountSwitcher from '@/components/AccountSwitcher'
import DepositWithdraw from '@/components/DepositWithdraw'
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
  const { auth, clearAuth, connected, allTicks, setAuth } = useStore();
  const [balance, setBalance] = useState<number | null>(auth?.balance ?? null);
  const [currency, setCurrency] = useState<string>(auth?.currency ?? 'USD');
  
  useDerivWS();

  useEffect(() => {
    if (auth) {
      setBalance(auth.balance);
      setCurrency(auth.currency);
    }
  }, [auth]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const initials = auth?.fullname?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';

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

          {/* Right section of navbar */}
          <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
            <DepositWithdraw />
            {balance !== null && (
              <div style={{ padding:'5px 10px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,textAlign:'right' }}>
                <div style={{ fontSize:13,fontWeight:700,color:'#e8eaf0',fontVariantNumeric:'tabular-nums' }}>{balance.toFixed(2)}</div>
                <div style={{ fontSize:9,color:'#4a5568',textTransform:'uppercase' }}>{currency}</div>
              </div>
            )}
            <AccountSwitcher onSwitch={(acc)=>{ 
              const newAuth = { ...auth!, balance: acc.balance ?? 0, currency: acc.currency, account: acc.loginid, token: acc.token };
              setAuth(newAuth);
              setBalance(acc.balance ?? null); 
              setCurrency(acc.currency || 'USD') 
            }} />
            <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,rgba(0,230,118,0.2),rgba(0,176,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#00e676',border:'1px solid rgba(0,230,118,0.2)',flexShrink:0 }}>
              {initials}
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
