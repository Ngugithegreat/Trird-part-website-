'use client';

import React from 'react';
import { useTradingStore } from '@/store/useStore';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export function TickFeed() {
  const { ticks } = useTradingStore();
  const displayTicks = ticks.slice(0, 15);

  return (
    <div className="flex flex-col h-full bg-card/20 rounded-xl border border-border overflow-hidden">
      <div className="p-3 border-b border-border bg-card/40 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-3 h-3 text-primary" />
          Live Tick Feed
        </h3>
        <span className="text-[10px] text-muted-foreground font-code">MS 250</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-background/90 backdrop-blur text-[10px] text-muted-foreground uppercase border-b border-border">
            <tr>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Price</th>
              <th className="px-4 py-2 font-medium text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {displayTicks.map((tick, i) => {
              const prevTick = displayTicks[i + 1];
              const isUp = prevTick ? tick.quote >= prevTick.quote : true;
              
              return (
                <tr key={`${tick.epoch}-${i}`} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-2.5 text-[11px] font-code text-muted-foreground">
                    {new Date(tick.epoch * 1000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className={cn(
                    "px-4 py-2.5 text-xs font-code font-bold",
                    isUp ? "text-primary" : "text-destructive"
                  )}>
                    {tick.quote.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {isUp ? 
                      <ArrowUpRight className="w-3.5 h-3.5 text-primary ml-auto" /> : 
                      <ArrowDownRight className="w-3.5 h-3.5 text-destructive ml-auto" />
                    }
                  </td>
                </tr>
              );
            })}
            {displayTicks.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Waiting for market connection...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}