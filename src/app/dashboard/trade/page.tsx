'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/store/useStore';
import { SYMBOLS, GRANULARITIES } from '@/lib/deriv';
import { useDerivWS } from '@/hooks/useDerivWS';
import { TrendingUp, TrendingDown, Clock, Activity, DollarSign, Timer, CreditCard } from 'lucide-react';

const TradingChart = dynamic(() => import('@/components/Chart'), { ssr: false });

export default function TradePage() {
  const [stake, setStake] = useState('10.00');
  const [duration, setDuration] = useState(5);
  const { currentSymbol, currentGranularity, setCurrentGranularity, tick, ticks, contracts } = useStore();
  const { placeTrade, changeSymbol } = useDerivWS();

  const handleTrade = (type: 'CALL' | 'PUT') => {
    placeTrade({
      contract_type: type,
      amount: parseFloat(stake),
      duration,
      duration_unit: 't',
    });
  };

  return (
    <div className="p-4 flex flex-col h-full gap-4 max-w-[1600px] mx-auto">
      {/* Symbol Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SYMBOLS.map((s) => (
          <button
            key={s.id}
            onClick={() => changeSymbol(s.id)}
            className={`
              px-4 py-2 rounded-lg border flex flex-col min-w-[120px] transition-all
              ${currentSymbol === s.id ? 'bg-[#00e676]/10 border-[#00e676] text-[#00e676]' : 'bg-[#0e1420] border-white/5 text-[#8892a4] hover:bg-white/5'}
            `}
          >
            <span className="text-[10px] font-bold uppercase">{s.short}</span>
            <span className="text-sm font-tabular font-bold text-white">
              {useStore.getState().allTicks[s.id]?.toFixed(s.pip) || '---'}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-[#0e1420] rounded-xl border border-white/5 p-2 flex items-center justify-between">
            <div className="flex gap-1">
              {GRANULARITIES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setCurrentGranularity(g.value)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${currentGranularity === g.value ? 'bg-[#1c2640] text-[#00e676]' : 'text-[#8892a4] hover:text-white'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          
          <TradingChart symbol={currentSymbol} granularity={currentGranularity} />

          {/* Tick Feed */}
          <div className="bg-[#0e1420] rounded-xl border border-white/5 flex-1 min-h-[300px] flex flex-col">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#e8eaf0] flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#00e676]" />
                LIVE TICK FEED
              </h3>
              <span className="text-[10px] font-bold text-[#8892a4]">MS 250</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0e1420] text-[10px] text-[#8892a4] uppercase font-bold">
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-tabular">
                  {ticks.slice(0, 15).map((t, i) => {
                    const next = ticks[i + 1];
                    const isUp = next ? t.price >= next.price : true;
                    return (
                      <tr key={t.epoch} className={`border-b border-white/5 animate-fade-in ${isUp ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                        <td className="px-4 py-2 opacity-60">
                          {new Date(t.epoch * 1000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 font-bold">{t.price.toFixed(SYMBOLS.find(s => s.id === currentSymbol)?.pip || 2)}</td>
                        <td className="px-4 py-2 text-right">{isUp ? '▲' : '▼'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Trade Panel */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-4">
          <div className="bg-[#0e1420] rounded-xl border border-white/5 p-4 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <span className="text-[11px] font-bold text-[#8892a4] uppercase">Current Price</span>
                <span className="text-[10px] text-[#00e676] bg-[#00e676]/10 px-1.5 py-0.5 rounded">LIVE</span>
              </div>
              <div className="text-3xl font-black font-tabular tracking-tighter">
                {tick?.quote?.toFixed(SYMBOLS.find(s => s.id === currentSymbol)?.pip || 2) || '---'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8892a4] uppercase flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" /> Stake Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '5', '10', '25'].map(v => (
                    <button key={v} onClick={() => setStake(v)} className={`h-8 rounded bg-[#1c2640] text-xs font-bold border border-white/5 hover:bg-white/10 ${stake === v ? 'text-[#00e676] border-[#00e676]/30' : 'text-white'}`}>${v}</button>
                  ))}
                </div>
                <input 
                  type="number" 
                  value={stake} 
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full h-11 bg-[#151d2e] border border-white/5 rounded-lg px-4 font-tabular font-bold text-lg focus:outline-none focus:border-[#00e676]/50" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8892a4] uppercase flex items-center gap-1.5">
                  <Timer className="w-3 h-3" /> Duration (Ticks)
                </label>
                <div className="flex gap-2">
                  {[1, 5, 10].map(d => (
                    <button key={d} onClick={() => setDuration(d)} className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all ${duration === d ? 'bg-[#00e676] text-black' : 'bg-[#1c2640] text-white hover:bg-white/5'}`}>{d} Ticks</button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#1c2640]/50 rounded-lg border border-white/5 text-center">
                <span className="text-[10px] font-bold text-[#8892a4] uppercase block mb-1">Potential Payout</span>
                <div className="text-[#00e676] font-black text-xl font-tabular">
                  ${(parseFloat(stake) * 1.95).toFixed(2)} <span className="text-[10px] opacity-60 ml-1">(+95.4%)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => handleTrade('CALL')} className="btn-primary h-14 rounded-xl flex items-center justify-center gap-2 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-lg font-black uppercase italic">Rise</span>
                </button>
                <button onClick={() => handleTrade('PUT')} className="btn-danger h-14 rounded-xl flex items-center justify-center gap-2 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-lg font-black uppercase italic">Fall</span>
                </button>
              </div>
            </div>
          </div>

          {/* Open Contracts */}
          <div className="bg-[#0e1420] rounded-xl border border-white/5 p-4 space-y-3">
            <h3 className="text-[10px] font-bold text-[#8892a4] uppercase flex items-center gap-1.5">
              <CreditCard className="w-3 h-3" /> Recent Activity
            </h3>
            <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-none">
              {contracts.map((c) => (
                <div key={c.id} className="p-3 bg-[#151d2e] rounded-lg border border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#8892a4] uppercase">{c.symbol.replace('R_', 'V')} · {c.type}</span>
                    <span className="text-xs font-bold text-white">${c.stake} → ${c.payout}</span>
                  </div>
                  <div className={`text-xs font-black uppercase italic ${c.profit >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                    {c.status === 'open' ? `$${c.profit.toFixed(2)}` : c.status}
                  </div>
                </div>
              ))}
              {contracts.length === 0 && (
                <div className="py-8 text-center text-[#4a5568] text-[10px] uppercase font-bold italic">No active contracts</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
