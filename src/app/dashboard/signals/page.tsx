'use client';

import React, { useState, useEffect } from 'react';
import { SYMBOLS } from '@/lib/deriv';
import { useStore } from '@/store/useStore';
import { Zap, TrendingUp, TrendingDown, ChevronRight, BarChart3, Clock, AlertTriangle } from 'lucide-react';

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const { ticks } = useStore();

  useEffect(() => {
    const calculateSignals = () => {
      const results = SYMBOLS.map((s, i) => {
        const mockConfidence = 45 + Math.random() * 50;
        const direction = Math.random() > 0.5 ? 'CALL' : 'PUT';
        return {
          id: s.id,
          name: s.label,
          short: s.short,
          direction,
          confidence: mockConfidence,
          underFive: Math.random() > 0.7,
        };
      });

      setSignals(results.sort((a, b) => b.confidence - a.confidence));
    };

    calculateSignals();
    const interval = setInterval(calculateSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">Live Trading Signals</h1>
          </div>
          <p className="text-sm text-[#8892a4] font-medium">Algorithm-powered sentiment analysis across all volatility indices.</p>
        </div>
        
        <div className="bg-[#0e1420] border border-white/5 rounded-full px-4 py-2 flex items-center gap-3">
          <Clock className="w-4 h-4 text-[#00e676]" />
          <span className="text-xs font-bold text-[#8892a4] uppercase italic">Next update in: <span className="text-white font-tabular">24s</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {signals.map((signal, idx) => (
          <div key={signal.id} className="bg-[#0e1420] border border-white/5 rounded-2xl p-6 hover:border-[#00e676]/30 transition-all group overflow-hidden relative">
            {/* Rank Badge */}
            <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl font-black italic text-[10px] tracking-widest ${idx === 0 ? 'bg-[#ffd600] text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-white/5 text-[#8892a4]'}`}>
              {idx < 3 ? `RANK #${idx + 1}` : `LOWER CONFIDENCE`}
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="text-white font-black text-xl italic tracking-tight">{signal.name}</h3>
                <span className="text-[10px] font-bold text-[#8892a4] uppercase tracking-widest">{signal.id}</span>
              </div>
              <div className={`${signal.direction === 'CALL' ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                {signal.direction === 'CALL' ? <TrendingUp className="w-10 h-10" /> : <TrendingDown className="w-10 h-10" />}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-[#8892a4]">Signal Confidence</span>
                  <span className={signal.confidence > 80 ? 'text-[#00e676]' : 'text-white'}>{signal.confidence.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1c2640] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${signal.confidence > 75 ? 'bg-[#00e676]' : signal.confidence > 55 ? 'bg-[#ffd600]' : 'bg-[#ff1744]'}`}
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '5-Tick Sentiment', value: signal.direction === 'CALL' ? 'BULLISH' : 'BEARISH' },
                  { label: 'Market Volatility', value: 'STABLE' },
                  { label: 'Price Velocity', value: 'HIGH' }
                ].map((stat, i) => (
                  <div key={i} className="p-2 bg-[#1c2640]/50 rounded-lg border border-white/5 text-center">
                    <span className="block text-[7px] font-bold text-[#8892a4] uppercase mb-1">{stat.label}</span>
                    <span className="text-[9px] font-black text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button className={`w-full h-12 rounded-xl font-black italic text-xs uppercase tracking-[0.15em] transition-all shadow-lg ${signal.direction === 'CALL' ? 'bg-[#00e676] text-black hover:bg-[#00c853]' : 'bg-[#ff1744] text-white hover:bg-[#d50000]'}`}>
                  Load {signal.direction === 'CALL' ? 'Rise' : 'Fall'} Signal
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-[#ffd600]/5 border border-[#ffd600]/20 rounded-2xl flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-[#ffd600] shrink-0" />
        <div className="space-y-1">
          <h4 className="text-[#ffd600] font-bold text-sm uppercase">Trading Risk Disclosure</h4>
          <p className="text-[#8892a4] text-xs leading-relaxed uppercase font-medium tracking-wider">
            Volatility indices are complex derivative products. Signals are algorithmic suggestions based on historical tick patterns and do not guarantee future results. High-frequency trading involves substantial risk of loss.
          </p>
        </div>
      </div>
    </div>
  );
}
