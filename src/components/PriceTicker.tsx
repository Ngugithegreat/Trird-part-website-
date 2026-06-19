'use client';

import React from 'react';
import { useTradingStore } from '@/store/useStore';
import { VOLATILITY_INDICES } from '@/lib/symbols';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function PriceTicker() {
  const prices = useTradingStore((state) => state.prices);

  // Duplicate indices for seamless loop
  const displayIndices = [...VOLATILITY_INDICES, ...VOLATILITY_INDICES];

  return (
    <div className="ticker-wrap flex-1 bg-background/50 backdrop-blur-sm border-x border-border/50 h-full overflow-hidden flex items-center">
      <div className="ticker-move flex items-center gap-12">
        {displayIndices.map((index, idx) => {
          const price = prices[index.symbol];
          const isUp = idx % 2 === 0; // Simulated for visual flair if live data isn't changing fast
          
          return (
            <div key={`${index.symbol}-${idx}`} className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 px-3 py-1 rounded transition-colors">
              <span className="text-xs font-bold text-muted-foreground group-hover:text-primary whitespace-nowrap">
                {index.name.replace('Volatility ', 'VOL ').replace(' Index', '')}
              </span>
              <span className={`text-xs font-code flex items-center gap-1 ${isUp ? 'text-primary' : 'text-destructive'}`}>
                {price?.toFixed(2) || '---'}
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}