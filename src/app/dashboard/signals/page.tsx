'use client'
import { useEffect, useState } from 'react'

const SYMS = [
  { id: 'R_10', l: 'Volatility 10', pip: 3 }, { id: 'R_25', l: 'Volatility 25', pip: 3 },
  { id: 'R_50', l: 'Volatility 50', pip: 2 }, { id: 'R_75', l: 'Volatility 75', pip: 2 },
  { id: 'R_100', l: 'Volatility 100', pip: 2 }, { id: '1HZ10V', l: 'V10 (1s)', pip: 3 },
  { id: '1HZ25V', l: 'V25 (1s)', pip: 3 }, { id: '1HZ50V', l: 'V50 (1s)', pip: 2 },
]

function calcSig(ticks: number[]) {
  if (ticks.length < 6) return { dir: 'CALL', conf: 50, under5: 55, most: 1, least: 3 }
  const last5 = ticks.slice(0, 5)
  let ups = 0, downs = 0
  for (let i = 0; i < last5.length - 1; i++) { last5[i] > last5[i + 1] ? ups++ : downs++ }
  const dir = ups >= downs ? 'CALL' : 'PUT'
  const last20 = ticks.slice(0, 20)
  let ok = 0
  for (let i = 0; i < last20.length - 1; i++) {
    const up = last20[i] > last20[i + 1]
    if ((dir === 'CALL' && up) || (dir === 'PUT' && !up)) ok++
  }
  const conf = Math.round((ok / Math.max(last20.length - 1, 1)) * 100)
  const digits = ticks.map(t => Math.round((t % 1) * 1000) % 10)
  const under5 = Math.round((digits.filter(d => d < 5).length / Math.max(digits.length, 1)) * 100)
  const c = Array(10).fill(0); digits.forEach(d => c[d]++)
  return { dir, conf, under5, most: c.indexOf(Math.max(...c)), least: c.indexOf(Math.min(...c)) }
}

export default function SignalsPage() {
  const [ticks, setTicks] = useState<Record<string, number[]>>({})
  const [sigs, setSigs] = useState<any[]>([])
  const [updated, setUpdated] = useState<string | null>(null)
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => SYMS.forEach(s => ws.send(JSON.stringify({ ticks: s.id, subscribe: 1 })))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick') {
        const p = parseFloat(d.tick.quote)
        setTicks(prev => ({ ...prev, [d.tick.symbol]: [p, ...(prev[d.tick.symbol] || [])].slice(0, 100) }))
      }
    }
    return () => ws.close()
  }, [appId])

  useEffect(() => {
    const id = setInterval(() => {
      const newSigs = SYMS.map(s => {
        const t = ticks[s.id] || []
        const sig = calcSig(t)
        return { ...s, ...sig, ticks: t.length }
      }).sort((a, b) => b.conf - a.conf).map((s, i) => ({ ...s, rank: i + 1 }))
      setSigs(newSigs)
      setUpdated(new Date().toLocaleTimeString())
    }, 5000)
    return () => clearInterval(id)
  }, [ticks])

  const rc = ['#ffd600', '#b0bec5', '#ff7043']

  return (
    <div style={{ padding: 24, background: '#06080f', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e676', animation: 'pulse 1.5s infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live Trading Signals</span>
        {updated && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4a5568' }}>Updated {updated}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {(sigs.length ? sigs : SYMS.map((s, i) => ({ ...s, rank: i + 1, dir: 'CALL', conf: 0, under5: 0, most: 0, least: 0, ticks: 0 }))).map(sig => (
          <div key={sig.id} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: sig.rank <= 3 ? `linear-gradient(135deg,${rc[sig.rank - 1]},${rc[sig.rank - 1]}99)` : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: sig.rank <= 3 ? '#000' : '#8892a4' }}>#{sig.rank}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0' }}>{sig.l}</div>
                  <div style={{ fontSize: 10, color: '#4a5568' }}>{sig.ticks} ticks</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,23,68,0.12)', color: '#ff1744', border: '1px solid rgba(255,23,68,0.2)' }}>UNDER $5</span>
                <span style={{ fontSize: 20 }}>{sig.dir === 'CALL' ? '🟢' : '🔴'}</span>
              </div>
            </div>
            <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Confidence</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 4 }}>
              <div style={{ height: 4, borderRadius: 2, width: `${sig.conf}%`, background: sig.conf > 60 ? '#00e676' : sig.conf > 40 ? '#ffd600' : '#ff1744', transition: 'width 0.5s' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: sig.conf > 60 ? '#00e676' : sig.conf > 40 ? '#ffd600' : '#ff1744', marginBottom: 10 }}>{sig.conf}%</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
              {[{ l: 'Under 5%', v: sig.under5 + '%' }, { l: 'Most', v: sig.most }, { l: 'Least', v: sig.least }].map((x, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase' }}>{x.l}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eaf0' }}>{x.v}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { localStorage.setItem('signal_preset', JSON.stringify({ sym: sig.id, dir: sig.dir })); window.location.href = '/dashboard/trade' }} style={{ width: '100%', padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'Inter,sans-serif', background: sig.dir === 'CALL' ? 'rgba(0,230,118,0.12)' : 'rgba(255,23,68,0.12)', color: sig.dir === 'CALL' ? '#00e676' : '#ff1744', borderWidth: 1, borderStyle: 'solid', borderColor: sig.dir === 'CALL' ? 'rgba(0,230,118,0.25)' : 'rgba(255,23,68,0.25)' }}>
              ⚡ Load {sig.dir === 'CALL' ? 'Rise' : 'Fall'} Signal
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
