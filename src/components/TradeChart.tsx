'use client'
import { useEffect, useRef, useState } from 'react'

interface Props { symbol: string; granularity: number }

export default function TradeChart({ symbol, granularity }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const areaRef = useRef<any>(null)
  const candleRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [chartType, setChartType] = useState<'area'|'candle'>('area')
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    if (!ref.current) return
    let ok = true
    import('lightweight-charts').then(({ createChart, CrosshairMode, LineStyle }) => {
      if (!ok || !ref.current) return
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }
      const chart = createChart(ref.current!, {
        width: ref.current!.clientWidth,
        height: ref.current!.clientHeight,
        layout: {
          background: { type: 'Solid' as any, color: '#0d1117' },
          textColor: '#8892a4',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.04)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true, secondsVisible: true, rightOffset: 5 },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { mouseWheel: true, pinch: true },
      })

      // Area series - looks exactly like Deriv's tick chart (sharp line with fill below)
      const area = chart.addAreaSeries({
        lineColor: '#00e676',
        lineWidth: 2,
        topColor: 'rgba(0,230,118,0.15)',
        bottomColor: 'rgba(0,230,118,0.0)',
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#00e676',
        crosshairMarkerBackgroundColor: '#00e676',
        priceLineColor: '#00e676',
        priceLineStyle: (LineStyle as any).Dashed,
        priceLineWidth: 1,
        lastValueVisible: true,
      })

      // Candle series hidden by default
      const candle = chart.addCandlestickSeries({
        upColor: '#00e676', downColor: '#ff1744',
        borderUpColor: '#00e676', borderDownColor: '#ff1744',
        wickUpColor: '#00e676', wickDownColor: '#ff1744',
        visible: false,
      })

      chartRef.current = chart
      areaRef.current = area
      candleRef.current = candle

      const ro = new ResizeObserver(() => {
        if (ref.current && chartRef.current)
          chartRef.current.applyOptions({ width: ref.current.clientWidth, height: ref.current.clientHeight })
      })
      ro.observe(ref.current!)
      return () => ro.disconnect()
    })
    return () => {
      ok = false
      wsRef.current?.close()
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }
    }
  }, [])

  // Toggle between area and candle
  useEffect(() => {
    if (!areaRef.current || !candleRef.current) return
    if (chartType === 'area') {
      areaRef.current.applyOptions({ visible: true })
      candleRef.current.applyOptions({ visible: false })
    } else {
      areaRef.current.applyOptions({ visible: false })
      candleRef.current.applyOptions({ visible: true })
    }
  }, [chartType])

  // WebSocket data
  useEffect(() => {
    wsRef.current?.close()
    const ticks: { time: any; value: number }[] = []
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    wsRef.current = ws

    ws.onopen = () => {
      // Live ticks for area chart
      ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }))
      // Candle history
      ws.send(JSON.stringify({
        ticks_history: symbol, style: 'candles',
        granularity, end: Math.floor(Date.now() / 1000), count: 300, subscribe: 1,
      }))
    }

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)

      // Every tick → update area chart (fast movement like Deriv)
      if (d.msg_type === 'tick' && d.tick && areaRef.current) {
        const pt = { time: d.tick.epoch as any, value: parseFloat(d.tick.quote) }
        ticks.push(pt)
        if (ticks.length > 800) ticks.shift()
        try { areaRef.current.update(pt) }
        catch { areaRef.current.setData([...ticks]) }
      }

      // Candle history
      if (d.msg_type === 'candles' && candleRef.current) {
        candleRef.current.setData(
          d.candles.map((c: any) => ({ time: c.epoch, open: +c.open, high: +c.high, low: +c.low, close: +c.close }))
        )
        if (chartType === 'candle') chartRef.current?.timeScale().fitContent()
      }

      // Candle updates
      if (d.msg_type === 'ohlc' && candleRef.current && d.ohlc) {
        const o = d.ohlc
        candleRef.current.update({
          time: Math.floor(+o.open_time / granularity) * granularity,
          open: +o.open, high: +o.high, low: +o.low, close: +o.close,
        })
      }
    }
    ws.onerror = () => ws.close()
    return () => ws.close()
  }, [symbol, granularity, appId])

  // Chart type toggle icons (matching Deriv style)
  const btnStyle = (active: boolean) => ({
    width: 32, height: 32, borderRadius: 6, border: 'none',
    background: active ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.04)',
    color: active ? '#00e676' : '#4a5568',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 14,
    outline: active ? '1px solid rgba(0,230,118,0.3)' : '1px solid transparent',
    transition: 'all 0.15s',
  } as React.CSSProperties)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0d1117' }}>
      {/* Chart type toggle - left side like Deriv */}
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 4,
        background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 4,
      }}>
        <button
          onClick={() => setChartType('area')}
          title="Area / Tick chart"
          style={btnStyle(chartType === 'area')}
        >〰</button>
        <button
          onClick={() => setChartType('candle')}
          title="Candlestick chart"
          style={btnStyle(chartType === 'candle')}
        >🕯</button>
      </div>

      {/* Live dot */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '3px 10px',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', animation: 'pulse 1s infinite' }} />
        <span style={{ fontSize: 10, color: '#00e676', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>LIVE</span>
      </div>

      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}