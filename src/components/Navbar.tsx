'use client';

import React from 'react';
import { useUserStore } from '@/store/useStore';
import { PriceTicker } from './PriceTicker';
import { Zap, Bell, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { account, balance, currency } = useUserStore();

  return (
    <header className="sticky top-0 z-50 h-14 w-full bg-card border-b border-border flex items-center px-4 justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-lg">
          <Zap className="text-background fill-background w-5 h-5" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-bold text-sm tracking-tight">TradeDesk Apex</span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Trading Terminal</span>
        </div>
      </div>

      {/* Center Ticker */}
      <PriceTicker />

      {/* Right User Actions */}
      <div className="flex items-center gap-3 min-w-fit">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00e676]"></div>
          <span className="text-xs font-code font-bold text-primary">
            {currency} {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-card"></span>
        </Button>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-secondary p-1 rounded-full transition-colors">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium hidden md:block">{account}</span>
        </div>
      </div>
    </header>
  );
}