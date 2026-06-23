'use client'
/**
 * @fileOverview Provides live algorithm-powered trading signals based on real-time tick data.
 */
import { useEffect, useState } from 'react'

const SYMBOLS = [
  { id: 'R_10', label: 'Volatility 10', short: 'V10' },
  { id: 'R_25', label: 'Volatility 25', short: 'V25' },
  { id: 'R_50', label: 'Volatility 50', short: 'V50' },
  { id: 'R_75', label: 'Volatility 75', short: 'V75' },
  { id: 'R_100', label: 'Volatility 100', short: 'V100' },
]

function calculateSignal(ticks: number[]) {
  if (ticks.length < 6) return { direction: 'CALL', confidence: 50, under5: 55, most: 1, least: 3 }
  const last5 = ticks.slice(0, 5)
  let ups = 0, downs = 0
  for (let i = 0; i < last5.length - 1; i++) {
    if (last5[i] > last5[i + 1]) ups++
    else downs++
  }
  const direction = ups >= downs ? 'CALL' : 'PUT'
  const last20 = ticks.slice(0, 20)
  let consistent = 0
  for (let i = 0; i < last20.length - 1; i++) {
    const up = last20[i] > last20[i + 1]
    if ((direction === 'CALL' && up) || (direction === 'PUT' && !up)) consistent++
  }
  const confidence = Math.round((consistent / Math.max(last20.length - 1, 1)) * 100)
  const digits = ticks.map(t => Math.round((t % 1) * 100) % 10)
  const under5 = Math.round((digits.filter(d => d < 5).length / digits.length) * 100)
  const counts = Array(10).fill(0)
  digits.forEach(d => counts[d]++)
  const most = counts.indexOf(Math.max(...counts))
  const least = counts.indexOf(Math.min(...counts))
  return { direction, confidence, under5, most, least }
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([])
  const [tickStore, setTickStore] = useState<Record<string, number[]>>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => {
      SYMBOLS.forEach(s => ws.send(JSON.stringify({ ticks: s.id, subscribe: 1 })))
    }
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick' && d.tick) {
        const sym = d.tick.symbol
        const price = parseFloat(d.tick.quote)
        setTickStore(prev => ({
          ...prev,
          [sym]: [price, ...(prev[sym] || [])].slice(0, 50)
        }))
      }
    }
    return () => ws.close()
  }, [appId])

  useEffect(() => {
    const interval = setInterval(() => {
      const newSignals = SYMBOLS.map(s => {
        const ticks = tickStore[s.id] || []
        const sig = calculateSignal(ticks)
        return { ...s, ...sig, ticks: ticks.length }
      }).sort((a, b) => b.confidence - a.confidence)
        .map((s, i) => ({ ...s, rank: i + 1 }))
      setSignals(newSignals)
      setLastUpdated(new Date())
    }, 5000)
    return () => clearInterval(interval)
  }, [tickStore])

  const rankColors = ['#ffd600', '#b0bec5', '#ff7043']

  return (
    <div style={{ padding: 24, background: '#06080f', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#00e676',
          animation: 'pulse 1.5s infinite'
        }}/>
        <span style={{ 
          fontSize: 13, fontWeight: 700, 
          color: '#e8eaf0', letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>Live Trading Signals</span>
        {lastUpdated && (
          <span style={{ fontSize: 11, color: '#4a5568', marginLeft: 'auto' }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Signal cards grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 14 
      }}>
        {signals.length === 0 ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} style={{
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 20,
              animation: 'pulse 1.5s infinite'
            }}>
              <div style={{ 
                height: 14, background: 'rgba(255,255,255,0.06)', 
                borderRadius: 4, marginBottom: 12, width: '60%' 
              }}/>
              <div style={{ 
                height: 40, background: 'rgba(255,255,255,0.04)', 
                borderRadius: 4, marginBottom: 12 
              }}/>
              <div style={{ 
                height: 10, background: 'rgba(255,255,255,0.03)', 
                borderRadius: 4, width: '80%' 
              }}/>
            </div>
          ))
        ) : signals.map((sig) => (
          <div key={sig.id} style={{
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: 20,
            transition: 'border-color 0.2s'
          }}>
            {/* Top row */}
            <div style={{ 
              display: 'flex', alignItems: 'center', 
              justifyContent: 'space-between', marginBottom: 14 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: sig.rank <= 3 
                    ? `linear-gradient(135deg, ${rankColors[sig.rank-1]}, ${rankColors[sig.rank-1]}99)`
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: sig.rank <= 3 ? '#000' : '#8892a4'
                }}>#{sig.rank}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>
                    {sig.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#4a5568' }}>
                    {sig.ticks} ticks collected
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(255,23,68,0.12)',
                  color: '#ff1744',
                  border: '1px solid rgba(255,23,68,0.2)'
                }}>UNDER $5</span>
                <span style={{ fontSize: 20 }}>
                  {sig.direction === 'CALL' ? '🟢' : '🔴'}
                </span>
              </div>
            </div>

            {/* Confidence bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', 
                marginBottom: 6 
              }}>
                <span style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Confidence
                </span>
                <span style={{ 
                  fontSize: 14, fontWeight: 700,
                  color: sig.confidence > 60 ? '#00e676' : sig.confidence > 40 ? '#ffd600' : '#ff1744'
                }}>{sig.confidence}%</span>
              </div>
              <div style={{ 
                height: 5, background: 'rgba(255,255,255,0.06)', 
                borderRadius: 3 
              }}>
                <div style={{
                  height: 5, borderRadius: 3,
                  width: `${sig.confidence}%`,
                  background: sig.confidence > 60 ? '#00e676' : sig.confidence > 40 ? '#ffd600' : '#ff1744',
                  transition: 'width 0.5s ease'
                }}/>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8, padding: '12px 0',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 14
            }}>
              {[
                { label: 'UNDER 5%', val: sig.under5 + '%' },
                { label: 'MOST', val: sig.most },
                { label: 'LEAST', val: sig.least },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0', marginTop: 3 }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Load Signal button */}
            <button
              onClick={() => window.location.href = '/dashboard/trade'}
              style={{
                width: '100%', padding: '10px',
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: 'none',
                fontFamily: 'Inter, sans-serif',
                background: sig.direction === 'CALL' 
                  ? 'rgba(0,230,118,0.12)' : 'rgba(255,23,68,0.12)',
                color: sig.direction === 'CALL' ? '#00e676' : '#ff1744',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: sig.direction === 'CALL' 
                  ? 'rgba(0,230,118,0.25)' : 'rgba(255,23,68,0.25)',
              }}
            >
              ⚡ Load {sig.direction === 'CALL' ? 'Rise' : 'Fall'} Signal
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
