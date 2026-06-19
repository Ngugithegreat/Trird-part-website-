'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const { candles, currentSymbol } = useStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart: any;

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode }) => {
      if (!chartContainerRef.current) return;

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#8892a4',
          fontFamily: 'Inter, sans-serif',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { labelBackgroundColor: '#151d2e' },
          horzLine: { labelBackgroundColor: '#151d2e' },
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.06)',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.06)',
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
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
    });

    return () => {
      window.removeEventListener('resize', () => {});
      if (chart) chart.remove();
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      seriesRef.current.setData(candles);
    }
  }, [candles]);

  return (
    <div className="relative w-full h-[400px] bg-[#0e1420]/50 rounded-xl overflow-hidden border border-white/5">
      <div ref={chartContainerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 bg-[#080b12]/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">{currentSymbol.replace('R_', 'VOL ')}</span>
        </div>
      </div>
    </div>
  );
}
