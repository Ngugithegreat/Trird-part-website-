'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Bot, 
  Layers, 
  BrainCircuit, 
  Zap, 
  Gift, 
  Users, 
  Search, 
  Rocket, 
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-[calc(100vh-3.5rem)] border-r border-border bg-card transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center h-10 px-3 rounded-lg transition-all group relative",
                  isActive 
                    ? "bg-primary/10 text-primary border-l-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}>
                  <item.icon className={cn("w-5 h-5 shrink-0", !collapsed && "mr-3")} />
                  {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                  
                  {collapsed && (
                    <div className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border shadow-xl">
                      {item.label}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-border flex flex-col gap-1">
        <Link href="/dashboard/settings">
          <div className={cn(
            "flex items-center h-10 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all",
            pathname === '/dashboard/settings' && "bg-secondary text-foreground"
          )}>
            <Settings className={cn("w-5 h-5 shrink-0", !collapsed && "mr-3")} />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </div>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-full justify-center text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>
    </aside>
  );
}
