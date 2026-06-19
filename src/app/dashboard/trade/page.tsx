'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTradingStore } from '@/store/useStore';
import { VOLATILITY_INDICES } from '@/lib/symbols';
import { TickFeed } from '@/components/TickFeed';
import { TradePanel } from '@/components/TradePanel';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Dynamic import for Lightweight Charts (Browser only)
const TradingChart = dynamic(() => import('@/components/Chart'), { 
  ssr: false,
  loading: () => <div className="w-full h-[450px] bg-card/50 animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Initializing Chart Terminal...</div>
});

export default function TradePage() {
  const { currentSymbol, setSymbol } = useTradingStore();

  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      {/* Symbol Tabs */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <Tabs value={currentSymbol} onValueChange={setSymbol} className="w-fit">
          <TabsList className="bg-transparent gap-2 p-0 h-auto">
            {VOLATILITY_INDICES.map((index) => (
              <TabsTrigger 
                key={index.symbol} 
                value={index.symbol}
                className="px-4 py-2 bg-card border border-border data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:border-primary whitespace-nowrap rounded-lg text-xs font-bold transition-all"
              >
                {index.name.replace('Volatility ', 'VOL ').replace(' Index', '')}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4">
          <TradingChart />
          <div className="flex-1 min-h-[300px]">
            <TickFeed />
          </div>
        </div>

        {/* Execution Area */}
        <div className="w-full lg:w-80 shrink-0">
          <TradePanel />
        </div>
      </div>
    </div>
  );
}