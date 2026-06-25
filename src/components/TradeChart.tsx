'use client'
import { useEffect, useRef, useState } from 'react'

interface Props { symbol: string; granularity: number }

export default function TradeChart({ symbol, granularity }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candleRef = useRef<any>(null)
  const lineRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [chartType, setChartType] = useState<'line'|'candle'>('line')
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    if (!ref.current) return
    let ok = true
    import('lightweight-charts').then(({ createChart, CrosshairMode, LineStyle }) => {
      if (!ok || !ref.current) return
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }
      const chart = createChart(ref.current, {
        width: ref.current.clientWidth, height: ref.current.clientHeight,
        layout: { background: { type: 'Solid' as any, color: 'transparent' }, textColor: '#8892a4' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
        timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true, secondsVisible: true, rightOffset: 10 },
      })
      lineRef.current = chart.addLineSeries({
        color: '#00e676', lineWidth: 2,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
        priceLineColor: '#00e676', priceLineStyle: (LineStyle as any).Dashed,
      })
      candleRef.current = chart.addCandlestickSeries({
        upColor: '#00e676', downColor: '#ff1744',
        borderUpColor: '#00e676', borderDownColor: '#ff1744',
        wickUpColor: '#00e676', wickDownColor: '#ff1744',
        visible: false,
      })
      chartRef.current = chart
      const ro = new ResizeObserver(() => {
        if (ref.current && chartRef.current)
          chartRef.current.applyOptions({ width: ref.current.clientWidth, height: ref.current.clientHeight })
      })
      ro.observe(ref.current)
      return () => ro.disconnect()
    })
    return () => {
      ok = false; wsRef.current?.close()
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (!candleRef.current || !lineRef.current) return
    if (chartType === 'line') {
      lineRef.current.applyOptions({ visible: true })
      candleRef.current.applyOptions({ visible: false })
    } else {
      lineRef.current.applyOptions({ visible: false })
      candleRef.current.applyOptions({ visible: true })
    }
  }, [chartType])

  useEffect(() => {
    wsRef.current?.close()
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    wsRef.current = ws
    const ticks: { time: any; value: number }[] = []
    ws.onopen = () => {
      ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }))
      ws.send(JSON.stringify({ ticks_history: symbol, style: 'candles', granularity, end: Math.floor(Date.now()/1000), count: 300, subscribe: 1 }))
    }
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick' && d.tick) {
        const pt = { time: d.tick.epoch as any, value: parseFloat(d.tick.quote) }
        ticks.push(pt); if (ticks.length > 600) ticks.shift()
        if (lineRef.current) { try { lineRef.current.update(pt) } catch { lineRef.current.setData([...ticks]) } }
      }
      if (d.msg_type === 'candles' && candleRef.current) {
        candleRef.current.setData(d.candles.map((c: any) => ({ time: c.epoch, open: +c.open, high: +c.high, low: +c.low, close: +c.close })))
        chartRef.current?.timeScale().fitContent()
      }
      if (d.msg_type === 'ohlc' && candleRef.current && d.ohlc) {
        const o = d.ohlc
        candleRef.current.update({ time: Math.floor(+o.open_time/granularity)*granularity, open: +o.open, high: +o.high, low: +o.low, close: +o.close })
      }
    }
    ws.onerror = () => ws.close()
    return () => ws.close()
  }, [symbol, granularity, appId])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', top: 8, left: 10, zIndex: 10, display: 'flex', gap: 2, background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 3 }}>
        {([['line','〰 Line'],['candle','🕯 Candles']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setChartType(v as any)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: chartType===v ? 'rgba(0,230,118,0.15)' : 'transparent', border: chartType===v ? '1px solid rgba(0,230,118,0.3)' : '1px solid transparent', color: chartType===v ? '#00e676' : '#4a5568', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{l}</button>
        ))}
      </div>
      {chartType === 'line' && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 20, padding: '3px 10px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: 10, color: '#00e676', fontWeight: 600 }}>LIVE TICK</span>
        </div>
      )}
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
