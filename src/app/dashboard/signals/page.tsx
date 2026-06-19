'use client';

import React, { useState, useEffect } from 'react';
import { VOLATILITY_INDICES } from '@/lib/symbols';
import { SignalCard } from '@/components/SignalCard';
import { calculateLocalSignal } from '@/lib/signals';
import { Radio } from 'lucide-react';

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial signals
    const generateSignals = () => {
      const newSignals = VOLATILITY_INDICES.map((index, i) => {
        // In a real app, this would use live store data
        const mockTicks = Array(20).fill(0).map(() => Math.random() * 100);
        const algo = calculateLocalSignal(mockTicks);
        return {
          ...index,
          ...algo,
          rank: 0 // Will be sorted
        };
      });

      // Sort by confidence
      const sorted = newSignals.sort((a, b) => b.confidence - a.confidence).map((s, i) => ({
        ...s,
        rank: i + 1
      }));
      
      setSignals(sorted);
    };

    generateSignals();
    const interval = setInterval(generateSignals, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Live Trading Signals</h1>
          </div>
          <p className="text-sm text-muted-foreground">AI-Calculated market sentiment based on high-velocity tick analysis</p>
        </div>
        
        <div className="flex items-center gap-4 px-4 py-2 bg-card rounded-lg border border-border text-xs font-bold text-muted-foreground italic">
          Next Update In: <span className="text-primary font-code not-italic">24s</span>
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {signals.map((signal) => (
          <SignalCard 
            key={signal.symbol}
            symbol={signal.symbol}
            name={signal.name}
            rank={signal.rank}
            direction={signal.direction}
            confidence={signal.confidence}
            underFive={signal.underFive}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-12 p-4 rounded-xl border border-border bg-card/20 text-center max-w-4xl mx-auto">
        <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest font-bold">
          Trading volatility indices carries a high level of risk. Signals provided by TradeDesk Apex are algorithmic suggestions and do not guarantee profits. Use appropriate risk management strategies.
        </p>
      </div>
    </div>
  );
}