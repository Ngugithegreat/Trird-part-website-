'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi } from 'lightweight-charts';
import { useTradingStore } from '@/store/useStore';

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { ticks, currentSymbol } = useTradingStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8892a4',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#00e676',
      downColor: '#ff1744',
      borderVisible: false,
      wickUpColor: '#00e676',
      wickDownColor: '#ff1744',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart data from ticks
  useEffect(() => {
    if (!seriesRef.current || ticks.length === 0) return;

    // Convert ticks to simple candle data for demo (real implementation would subscribe to candles)
    // Here we just map the latest tick to the series as a line-like candlestick update
    const lastTick = ticks[0];
    seriesRef.current.update({
      time: lastTick.epoch as any,
      open: lastTick.quote,
      high: lastTick.quote,
      low: lastTick.quote,
      close: lastTick.quote,
    });
  }, [ticks]);

  return (
    <div className="relative w-full h-[450px] bg-card/30 rounded-xl overflow-hidden border border-border">
      <div ref={chartContainerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-background/80 backdrop-blur px-2 py-1 rounded border border-border text-[10px] font-bold text-primary">
          LIVE {currentSymbol}
        </div>
      </div>
    </div>
  );
}