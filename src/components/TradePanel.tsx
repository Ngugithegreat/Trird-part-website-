'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Info, DollarSign, Wallet } from 'lucide-react';
import { useTradingStore, useUserStore } from '@/store/useStore';

export function TradePanel() {
  const [stake, setStake] = useState('10.00');
  const [duration, setDuration] = useState('5');
  const { currentSymbol } = useTradingStore();
  const { balance } = useUserStore();

  const stakes = ['1', '5', '10', '25', '50', '100'];

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border border-border h-full shadow-2xl">
      <div>
        <Tabs defaultValue="rise_fall" className="w-full">
          <TabsList className="grid grid-cols-2 bg-secondary/50 p-1 h-10">
            <TabsTrigger value="rise_fall" className="text-[11px] font-bold">Rise/Fall</TabsTrigger>
            <TabsTrigger value="accumulators" className="text-[11px] font-bold">Accumulators</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {/* Stake Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
              Stake Amount
              <Info className="w-3 h-3 cursor-help" />
            </label>
            <span className="text-[10px] text-primary flex items-center gap-1 font-bold">
              <Wallet className="w-2.5 h-2.5" />
              MAX: {balance.toFixed(2)}
            </span>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-9 bg-secondary/50 border-border focus:ring-primary h-12 text-lg font-code"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              type="number"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {stakes.map(val => (
              <Button 
                key={val} 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-code bg-secondary/30 hover:bg-primary hover:text-background border-none"
                onClick={() => setStake(val)}
              >
                ${val}
              </Button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase px-1">Duration (Ticks)</label>
          <div className="flex gap-2">
            {[1, 5, 10].map(d => (
              <Button 
                key={d} 
                variant={parseInt(duration) === d ? "default" : "secondary"}
                className={cn(
                  "flex-1 h-10 text-xs font-bold",
                  parseInt(duration) === d ? "bg-primary text-background" : "bg-secondary/50"
                )}
                onClick={() => setDuration(d.toString())}
              >
                {d} Ticks
              </Button>
            ))}
          </div>
        </div>

        {/* Payout Preview */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Estimated Payout</span>
            <span className="text-primary font-bold">19.54 USD</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Profit (%)</span>
            <span className="text-primary font-bold">95.4%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          <Button className="h-16 bg-primary hover:bg-primary/90 text-background flex flex-col items-center gap-0.5 shadow-[0_4px_20px_rgba(0,230,118,0.2)]">
            <span className="flex items-center gap-2 text-lg font-black uppercase">
              <TrendingUp className="w-5 h-5" />
              Rise
            </span>
            <span className="text-[10px] font-bold opacity-80">PROFIT: $19.54</span>
          </Button>
          
          <Button className="h-16 bg-destructive hover:bg-destructive/90 text-white flex flex-col items-center gap-0.5 shadow-[0_4px_20px_rgba(255,23,68,0.2)]">
            <span className="flex items-center gap-2 text-lg font-black uppercase">
              <TrendingDown className="w-5 h-5" />
              Fall
            </span>
            <span className="text-[10px] font-bold opacity-80">PROFIT: $19.54</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}