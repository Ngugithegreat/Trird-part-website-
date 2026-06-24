'use client'
import { useEffect, useRef } from 'react'

interface Props { 
  symbol: string; 
  granularity: number 
}

export default function TradeChart({ symbol, granularity }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    if (!ref.current) return
    let destroyed = false

    import('lightweight-charts').then(({ createChart, CrosshairMode }) => {
      if (destroyed || !ref.current) return
      if (chartRef.current) { 
        chartRef.current.remove()
        chartRef.current = null 
      }

      const chart = createChart(ref.current!, {
        width: ref.current!.clientWidth,
        height: ref.current!.clientHeight,
        layout: { 
          background: { type: 'Solid' as any, color: 'transparent' }, 
          textColor: '#8892a4' 
        },
        grid: { 
          vertLines: { color: 'rgba(255,255,255,0.04)' }, 
          horzLines: { color: 'rgba(255,255,255,0.04)' } 
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
        timeScale: { 
          borderColor: 'rgba(255,255,255,0.06)', 
          timeVisible: true, 
          secondsVisible: granularity < 300 
        },
      })

      const series = chart.addCandlestickSeries({
        upColor: '#00e676', 
        downColor: '#ff1744',
        borderUpColor: '#00e676', 
        borderDownColor: '#ff1744',
        wickUpColor: '#00e676', 
        wickDownColor: '#ff1744',
      })

      chartRef.current = chart
      seriesRef.current = series

      const ro = new ResizeObserver(() => {
        if (ref.current && chartRef.current) {
          chartRef.current.applyOptions({ 
            width: ref.current.clientWidth, 
            height: ref.current.clientHeight 
          })
        }
      })
      ro.observe(ref.current)

      // Dedicated WebSocket for OHLC data
      wsRef.current?.close()
      const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ 
          ticks_history: symbol, 
          style: 'candles', 
          granularity, 
          end: Math.floor(Date.now() / 1000), 
          count: 300, 
          subscribe: 1 
        }))
      }

      ws.onmessage = (e) => {
        const d = JSON.parse(e.data)
        if (d.msg_type === 'candles' && seriesRef.current) {
          seriesRef.current.setData(d.candles.map((c: any) => ({ 
            time: c.epoch, 
            open: +c.open, 
            high: +c.high, 
            low: +c.low, 
            close: +c.close 
          })))
          chartRef.current?.timeScale().fitContent()
        }
        if (d.msg_type === 'ohlc' && seriesRef.current && d.ohlc) {
          const o = d.ohlc
          if (o.symbol === symbol) {
            seriesRef.current.update({ 
              time: Math.floor(+o.open_time / granularity) * granularity, 
              open: +o.open, 
              high: +o.high, 
              low: +o.low, 
              close: +o.close 
            })
          }
        }
      }

      return () => { ro.disconnect() }
    })

    return () => {
      destroyed = true
      wsRef.current?.close()
      if (chartRef.current) { 
        chartRef.current.remove()
        chartRef.current = null 
      }
    }
  }, [symbol, granularity, appId])

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}
