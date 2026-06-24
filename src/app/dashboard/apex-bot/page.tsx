'use client'
import { useState, useEffect, useRef } from 'react'

const SYMS_A = [{ id: 'R_10', l: 'V10' }, { id: 'R_25', l: 'V25' }, { id: 'R_50', l: 'V50' }, { id: 'R_75', l: 'V75' }, { id: 'R_100', l: 'V100' }]
const STRATS = [
  { id: 'flat', n: 'Flat Betting', d: 'Fixed stake every trade', r: 'Low', c: '#00e676' },
  { id: 'martingale', n: 'Martingale', d: 'Double after loss', r: 'High', c: '#ff1744' },
  { id: 'anti_martingale', n: 'Anti-Martingale', d: 'Double after win', r: 'High', c: '#ff1744' },
  { id: "dalembert", n: "D'Alembert", d: '+1 unit after loss', r: 'Medium', c: '#ffd600' },
  { id: 'fibonacci', n: 'Fibonacci', d: 'Follow Fibonacci sequence', r: 'Medium', c: '#ffd600' },
]

export default function ApexBotPage() {
  const [sym, setSym] = useState('R_50')
  const [strat, setStrat] = useState('flat')
  const [dir, setDir] = useState<'CALL' | 'PUT'>('CALL')
  const [initStake, setInitStake] = useState('1')
  const [maxStake, setMaxStake] = useState('100')
  const [maxLoss, setMaxLoss] = useState('50')
  const [tp, setTp] = useState('100')
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ w: 0, l: 0, p: 0 })
  const [log, setLog] = useState<{ t: string; m: string; k: string }[]>([])
  const [stake, setStake] = useState('1')
  const [price, setPrice] = useState<number | null>(null)
  const stopRef = useRef(false)
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => ws.send(JSON.stringify({ ticks: sym, subscribe: 1 }))
    ws.onmessage = (e) => { 
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick') setPrice(parseFloat(d.tick.quote)) 
    }
    return () => ws.close()
  }, [sym, appId])

  const log_ = (m: string, k: string) => setLog(p => [{ t: new Date().toLocaleTimeString(), m, k }, ...p].slice(0, 60))

  const nextStake = (prev: number, won: boolean) => {
    const init = parseFloat(initStake) || 1, max = parseFloat(maxStake) || 100
    let n = prev
    if (strat === 'martingale') n = won ? init : prev * 2
    else if (strat === 'anti_martingale') n = won ? prev * 2 : init
    else if (strat === 'dalembert') n = won ? Math.max(init, prev - init) : prev + init
    else if (strat === 'fibonacci') { 
      const f = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
      n = won ? init : init * (f[Math.min(f.indexOf(prev / init) + 1, f.length - 1)] || 1) 
    }
    else n = init
    return Math.min(n, max)
  }

  const runOnce = (token: string, st: number) => new Promise<{ won: boolean; profit: number }>(resolve => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    const t = setTimeout(() => { ws.close(); resolve({ won: false, profit: -st }) }, 15000)
    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'authorize') ws.send(JSON.stringify({ buy: 1, price: st, parameters: { contract_type: dir, symbol: sym, duration: 1, duration_unit: 't', amount: st, basis: 'stake', currency: 'USD' } }))
      if (d.msg_type === 'buy' && !d.error) ws.send(JSON.stringify({ proposal_open_contract: 1, contract_id: d.buy.contract_id, subscribe: 1 }))
      if (d.msg_type === 'proposal_open_contract' && d.proposal_open_contract?.is_sold) {
        const poc = d.proposal_open_contract; clearTimeout(t); ws.close()
        resolve({ won: poc.profit > 0, profit: poc.profit })
      }
      if (d.error) { clearTimeout(t); ws.close(); resolve({ won: false, profit: -st }) }
    }
    ws.onerror = () => { clearTimeout(t); ws.close(); resolve({ won: false, profit: -st }) }
  })

  const start = async () => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) { alert('Login first'); return }
    const { token } = JSON.parse(auth)
    stopRef.current = false; setRunning(true); setStats({ w: 0, l: 0, p: 0 }); setLog([])
    log_('Apex Bot started', 'info')
    let w = 0, l = 0, p = 0, st = parseFloat(initStake) || 1
    while (!stopRef.current) {
      if (Math.abs(Math.min(0, p)) >= parseFloat(maxLoss)) { log_('Max loss reached. Stopped.', 'loss'); break }
      if (p >= parseFloat(tp)) { log_('Take profit reached!', 'win'); break }
      setStake(st.toFixed(2))
      const res = await runOnce(token, st)
      res.won ? w++ : l++; p += res.profit
      setStats({ w, l, p })
      log_(`${res.won ? 'WIN' : 'LOSS'}: $${res.profit.toFixed(2)} | Stake was $${st.toFixed(2)}`, res.won ? 'win' : 'loss')
      st = nextStake(st, res.won)
      await new Promise(r => setTimeout(r, 2000))
    }
    setRunning(false)
  }

  const inp = { width: '100%', padding: '7px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none' } as React.CSSProperties

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', background: '#06080f', overflow: 'hidden' }}>
      <div style={{ width: 270, background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eaf0' }}>⚡ Apex Bot</div>
        <div>
          <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Symbol</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{SYMS_A.map(s => <button key={s.id} onClick={() => setSym(s.id)} style={{ padding: '5px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: sym === s.id ? 'rgba(0,230,118,0.1)' : 'transparent', border: sym === s.id ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.06)', color: sym === s.id ? '#00e676' : '#4a5568', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{s.l}</button>)}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['CALL', 'PUT'] as const).map(d => <button key={d} onClick={() => setDir(d)} style={{ flex: 1, padding: '9px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: dir === d ? (d === 'CALL' ? 'rgba(0,230,118,0.12)' : 'rgba(255,23,68,0.1)') : 'transparent', border: dir === d ? `1px solid ${d === 'CALL' ? 'rgba(0,230,118,0.3)' : 'rgba(255,23,68,0.25)'}` : '1px solid rgba(255,255,255,0.06)', color: dir === d ? (d === 'CALL' ? '#00e676' : '#ff1744') : '#4a5568', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{d === 'CALL' ? '▲ Rise' : '▼ Fall'}</button>)}
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Strategy</div>
          {STRATS.map(s => <button key={s.id} onClick={() => setStrat(s.id)} style={{ width: '100%', textAlign: 'left', padding: '7px 9px', borderRadius: 6, marginBottom: 3, background: strat === s.id ? 'rgba(0,230,118,0.06)' : 'transparent', border: strat === s.id ? '1px solid rgba(0,230,118,0.2)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}><div style={{ fontSize: 12, fontWeight: 600, color: strat === s.id ? '#e8eaf0' : '#8892a4' }}>{s.n}</div><div style={{ fontSize: 10, color: '#4a5568' }}>{s.d}</div></button>)}
        </div>
        {[
          { label: 'Initial Stake ($)', val: initStake, set: setInitStake },
          { label: 'Max Stake ($)', val: maxStake, set: setMaxStake },
          { label: 'Max Loss ($)', val: maxLoss, set: setMaxLoss },
          { label: 'Take Profit ($)', val: tp, set: setTp }
        ].map((f: any) => (
          <div key={f.label}><div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{f.label}</div><input type="number" value={f.val} onChange={e => f.set(e.target.value)} style={inp} /></div>
        ))}
        {!running
          ? <button onClick={start} style={{ padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#00e676,#00b0ff)', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>▶ Start Apex Bot</button>
          : <button onClick={() => stopRef.current = true} style={{ padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#ff1744,#d50000)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>⏹ Stop Bot</button>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Trades', val: stats.w + stats.l, color: '#e8eaf0' },
            { label: 'Wins', val: stats.w, color: '#00e676' },
            { label: 'Losses', val: stats.l, color: '#ff1744' },
            { label: 'P&L', val: '$' + stats.p.toFixed(2), color: stats.p >= 0 ? '#00e676' : '#ff1744' }
          ].map((s: any, i) => (
            <div key={i} style={{ padding: '18px 20px', background: '#0d1117', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        {running && <div style={{ padding: '8px 16px', background: 'rgba(0,230,118,0.06)', borderBottom: '1px solid rgba(0,230,118,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e676', animation: 'pulse 1s infinite' }} /><span style={{ fontSize: 12, color: '#00e676' }}>Running — Stake: ${stake}{price ? ` — ${sym}: ${price.toFixed(2)}` : ''}</span></div>}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Trade Log</div>
          {log.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4a5568' }}><div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div><p>Configure and click Start to begin.</p></div>
            : log.map((x, i) => <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 10px', borderRadius: 6, marginBottom: 3, background: x.k === 'win' ? 'rgba(0,230,118,0.04)' : x.k === 'loss' ? 'rgba(255,23,68,0.04)' : 'rgba(255,255,255,0.02)' }}><span style={{ fontSize: 10, color: '#4a5568', flexShrink: 0 }}>{x.t}</span><span style={{ fontSize: 12, color: x.k === 'win' ? '#00e676' : x.k === 'loss' ? '#ff1744' : '#8892a4' }}>{x.m}</span></div>)}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
