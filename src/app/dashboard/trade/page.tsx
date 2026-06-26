'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState, useRef, useCallback } from 'react'

const Chart = dynamic(() => import('@/components/TradeChart'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #00e676', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
})

const SYMS = [
  { id: 'R_10', l: 'V10', pip: 3 }, { id: 'R_25', l: 'V25', pip: 3 },
  { id: 'R_50', l: 'V50', pip: 2 }, { id: 'R_75', l: 'V75', pip: 2 },
  { id: 'R_100', l: 'V100', pip: 2 },
  { id: '1HZ10V', l: 'V10s', pip: 3 }, { id: '1HZ25V', l: 'V25s', pip: 3 },
  { id: '1HZ50V', l: 'V50s', pip: 2 }, { id: '1HZ75V', l: 'V75s', pip: 2 },
  { id: '1HZ100V', l: 'V100s', pip: 2 },
]

const TFS = [
  { v: 0, l: '1T' }, // 0 = tick chart
  { v: 60, l: '1m' }, { v: 300, l: '5m' }, { v: 900, l: '15m' },
  { v: 1800,  l: '30m' }, { v: 3600,  l: '1h'  }, { v: 14400, label: '4h' }, { v: 86400, label: '1D' },
].map(tf => ({ v: tf.v, l: tf.l }))

const CONTRACT_TYPES = [
  { id: 'rise_fall', l: 'Rise/Fall', icon: '📈', contracts: [{ label: '▲ Rise', type: 'CALL', color: '#00e676' }, { label: '▼ Fall', type: 'PUT', color: '#ff1744' }] },
  { id: 'accumulators', l: 'Accumulators', icon: '📊', contracts: [{ label: '▲ Buy', type: 'ACCU', color: '#00e676' }] },
  { id: 'match_differ', l: 'Match/Differ', icon: '🎯', contracts: [{ label: 'Matches', type: 'DIGITMATCH', color: '#00e676' }, { label: 'Differs', type: 'DIGITDIFF', color: '#ff1744' }] },
  { id: 'even_odd', l: 'Even/Odd', icon: '⚖️', contracts: [{ label: 'Even', type: 'DIGITEVEN', color: '#00e676' }, { label: 'Odd', type: 'DIGITODD', color: '#ff1744' }] },
  { id: 'over_under', l: 'Over/Under', icon: '🎲', contracts: [{ label: 'Over 4', type: 'DIGITOVER', color: '#00e676' }, { label: 'Under 5', type: 'DIGITUNDER', color: '#ff1744' }] },
  { id: 'touch', l: 'Touch', icon: '👆', contracts: [{ label: 'Touch', type: 'ONETOUCH', color: '#00e676' }, { label: 'No Touch', type: 'NOTOUCH', color: '#ff1744' }] },
  { id: 'turbos', l: 'Turbos', icon: '⚡', contracts: [{ label: '⚡ Long', type: 'TURBOSLONG', color: '#00e676' }, { label: '⚡ Short', type: 'TURBOSSHORT', color: '#ff1744' }] },
  { id: 'vanillas', l: 'Vanillas', icon: '🍦', contracts: [{ label: 'Call', type: 'VANILLALONGCALL', color: '#00e676' }, { label: 'Put', type: 'VANILLALONGPUT', color: '#ff1744' }] },
]

const DURS = [
  { v: 1, u: 't', l: '1t' }, { v: 5, u: 't', l: '5t' }, { v: 10, u: 't', l: '10t' },
  { v: 1, u: 'm', l: '1m' }, { v: 5, u: 'm', l: '5m' }, { v: 15, u: 'm', l: '15m' },
  { v: 30, u: 'm', l: '30m' }, { v: 1, u: 'h', l: '1h' },
]

export default function TradePage() {
  const [sym, setSym] = useState('1HZ100V')
  const [pip, setPip] = useState(2)
  const [gran, setGran] = useState(0)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [ct, setCt] = useState('rise_fall')
  const [stake, setStake] = useState('10')
  const [dur, setDur] = useState(DURS[1])
  const [accumRate, setAccumRate] = useState(3)
  const [digit, setDigit] = useState(5)
  const [barrier, setBarrier] = useState('+0.001')
  const [payout, setPayout] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [openContracts, setOpenContracts] = useState<any[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  // Prices ticker
  useEffect(() => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    wsRef.current = ws
    ws.onopen = () => SYMS.forEach(s => ws.send(JSON.stringify({ ticks: s.id, subscribe: 1 })))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick') setPrices(p => ({ ...p, [d.tick.symbol]: parseFloat(d.tick.quote) }))
    }
    ws.onerror = () => ws.close()
    return () => ws.close()
  }, [appId])

  useEffect(() => { const s = SYMS.find(x => x.id === sym); if (s) setPip(s.pip) }, [sym])

  const buildParams = (ctype: string) => {
    const base = { symbol: sym, amount: parseFloat(stake) || 10, basis: 'stake', currency: 'USD' }
    switch (ct) {
      case 'rise_fall': return { ...base, contract_type: ctype, duration: dur.v, duration_unit: dur.u }
      case 'accumulators': return { ...base, contract_type: 'ACCU', growth_rate: accumRate / 100, duration: 0, duration_unit: 't' }
      case 'match_differ': return { ...base, contract_type: ctype, duration: 1, duration_unit: 't', selected_tick: digit }
      case 'even_odd': return { ...base, contract_type: ctype, duration: 1, duration_unit: 't' }
      case 'over_under': return { ...base, contract_type: ctype, duration: 1, duration_unit: 't', barrier: '4' }
      case 'touch': return { ...base, contract_type: ctype, duration: dur.v, duration_unit: dur.u, barrier }
      case 'turbos': return { ...base, contract_type: ctype, duration: dur.v, duration_unit: dur.u, barrier }
      case 'vanillas': return { ...base, contract_type: ctype, duration: dur.v, duration_unit: dur.u, barrier }
      default: return { ...base, contract_type: ctype, duration: dur.v, duration_unit: dur.u }
    }
  }

  // Live payout proposal
  useEffect(() => {
    setPayout(null)
    const timeout = setTimeout(async () => {
      const auth = localStorage.getItem('deriv_auth')
      if (!auth) return
      const { token } = JSON.parse(auth)
      const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
      ws.onopen = () => ws.send(JSON.stringify({ authorize: token }))
      ws.onmessage = (e) => {
        const d = JSON.parse(e.data)
        if (d.msg_type === 'authorize') {
          ws.send(JSON.stringify({ proposal: 1, ...buildParams('CALL') }))
        }
        if (d.msg_type === 'proposal' && d.proposal) {
          const p = parseFloat(d.proposal.payout), s = parseFloat(stake) || 10
          setPayout(`$${p.toFixed(2)} (+${Math.round((p / s - 1) * 100)}%)`)
          ws.close()
        }
        if (d.error) ws.close()
      }
      ws.onerror = () => ws.close()
    }, 500)
    return () => clearTimeout(timeout)
  }, [ct, stake, dur, sym, accumRate, digit, barrier])

  const trade = async (ctype: string) => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) { setResult({ ok: false, msg: 'Please login first' }); return }
    const { token } = JSON.parse(auth)
    setLoading(true); setResult(null)
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'authorize') {
        ws.send(JSON.stringify({ buy: 1, price: parseFloat(stake) || 10, parameters: buildParams(ctype) }))
      }
      if (d.msg_type === 'buy') {
        setLoading(false)
        if (d.error) { setResult({ ok: false, msg: d.error.message }); ws.close(); return }
        const contract = {
          id: d.buy.contract_id,
          type: ctype,
          stake: d.buy.buy_price,
          payout: d.buy.payout,
          status: 'open',
          profit: null,
          symbol: sym,
          time: new Date().toLocaleTimeString(),
        }
        setOpenContracts(prev => [contract, ...prev].slice(0, 10))
        setResult({ ok: true, msg: `✓ Trade placed! Contract #${d.buy.contract_id}` })
        // Subscribe to contract updates
        ws.send(JSON.stringify({ proposal_open_contract: 1, contract_id: d.buy.contract_id, subscribe: 1 }))
      }
      if (d.msg_type === 'proposal_open_contract' && d.proposal_open_contract) {
        const poc = d.proposal_open_contract
        if (poc.is_sold) {
          setOpenContracts(prev => prev.map(c => c.id === poc.contract_id ? { ...c, status: poc.profit >= 0 ? 'won' : 'lost', profit: poc.profit } : c))
          ws.close()
        }
      }
    }
    ws.onerror = () => { setLoading(false); setResult({ ok: false, msg: 'Connection error' }); ws.close() }
  }

  const price = prices[sym]
  const lastDigit = price ? Math.round((price % 1) * Math.pow(10, pip)) % 10 : null
  const ctObj = CONTRACT_TYPES.find(c => c.id === ct)!

  const btnStyle = (color: string) => ({
    flex: 1, padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700,
    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter,sans-serif', opacity: loading ? 0.6 : 1,
    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
    color: color === '#00e676' ? '#000' : '#fff',
    transition: 'all 0.15s',
  } as React.CSSProperties)

  const pill = (active: boolean, color = '#00e676') => ({
    padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
    border: active ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.06)',
    color: active ? color : '#4a5568',
    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
  } as React.CSSProperties)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 96px)', background: '#06080f', overflow: 'hidden' }}>
      {/* LEFT: Chart */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Symbol + price row */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {/* Symbol pills */}
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', flex: 1 }}>
            {SYMS.map(s => (
              <button key={s.id} onClick={() => setSym(s.id)} style={{
                padding: '10px 14px', background: 'transparent', border: 'none',
                borderBottom: sym === s.id ? '2px solid #00e676' : '2px solid transparent',
                color: sym === s.id ? '#e8eaf0' : '#4a5568',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'Inter,sans-serif', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              }}>
                <span>{s.l}</span>
                {prices[s.id] && (
                  <span style={{ fontSize: 9, fontVariantNumeric: 'tabular-nums', color: sym === s.id ? '#00e676' : '#4a5568' }}>
                    {prices[s.id].toFixed(s.pip)}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* Live price */}
          {price && (
            <div style={{ padding: '0 16px', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e8eaf0', fontVariantNumeric: 'tabular-nums' }}>{price.toFixed(pip)}</div>
              <div style={{ fontSize: 9, color: '#00e676', textAlign: 'right' }}>● LIVE</div>
            </div>
          )}
        </div>

        {/* Timeframe */}
        <div style={{ display: 'flex', gap: 3, padding: '6px 12px', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {TFS.map(tf => (
            <button key={tf.v} onClick={() => setGran(tf.v)} style={pill(gran === tf.v)}>{tf.l}</button>
          ))}
        </div>

        {/* Chart fills everything */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Chart symbol={sym} granularity={gran === 0 ? 60 : gran} />
        </div>
      </div>

      {/* RIGHT: Trade panel */}
      <div style={{ width: 300, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>

          {/* CONTRACT TYPE grid */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Contract Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {CONTRACT_TYPES.map(c => (
                <button key={c.id} onClick={() => setCt(c.id)} style={{
                  padding: '7px 5px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                  background: ct === c.id ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)',
                  border: ct === c.id ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  color: ct === c.id ? '#00e676' : '#8892a4',
                  cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  <span>{c.icon}</span><span>{c.l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STAKE */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Stake (USD)</div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
              {['1','5','10','25','50','100'].map(v => (
                <button key={v} onClick={() => setStake(v)} style={{ flex: 1, padding: '4px 2px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: stake === v ? '#1c2640' : 'transparent', border: stake === v ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)', color: stake === v ? '#e8eaf0' : '#4a5568', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>${v}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0 10px' }}>
              <span style={{ color: '#4a5568' }}>$</span>
              <input type="number" value={stake} onChange={e => setStake(e.target.value)} style={{ flex: 1, padding: '8px 6px', background: 'transparent', border: 'none', outline: 'none', color: '#e8eaf0', fontSize: 15, fontWeight: 600, fontFamily: 'Inter,sans-serif' }} />
            </div>
          </div>

          {/* DURATION */}
          {['rise_fall','touch','turbos','vanillas'].includes(ct) && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Duration</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {DURS.map(d => <button key={d.l} onClick={() => setDur(d)} style={pill(dur.l === d.l)}>{d.l}</button>)}
              </div>
            </div>
          )}

          {/* ACCUMULATORS */}
          {ct === 'accumulators' && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Growth Rate</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3,4,5].map(r => <button key={r} onClick={() => setAccumRate(r)} style={pill(accumRate === r)}>{r}%</button>)}
              </div>
            </div>
          )}

          {/* MATCH/DIFFER */}
          {ct === 'match_differ' && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Last Digit Prediction</div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0,1,2,3,4,5,6,7,8,9].map(d => (
                  <button key={d} onClick={() => setDigit(d)} style={{ flex: 1, padding: '6px 2px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: digit === d ? 'rgba(0,176,255,0.15)' : lastDigit === d ? 'rgba(255,214,0,0.1)' : 'rgba(255,255,255,0.03)', border: digit === d ? '1px solid rgba(0,176,255,0.4)' : lastDigit === d ? '1px solid rgba(255,214,0,0.3)' : '1px solid rgba(255,255,255,0.06)', color: digit === d ? '#2979ff' : lastDigit === d ? '#ffd600' : '#8892a4', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'center' }}>{d}</button>
                ))}
              </div>
              {lastDigit !== null && <p style={{ fontSize: 10, color: '#4a5568', marginTop: 4 }}>Current last digit: <strong style={{ color: '#ffd600' }}>{lastDigit}</strong></p>}
            </div>
          )}

          {/* EVEN/ODD info */}
          {ct === 'even_odd' && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {lastDigit !== null && <p style={{ fontSize: 12, color: '#8892a4' }}>Current last digit: <strong style={{ color: lastDigit % 2 === 0 ? '#00e676' : '#ff1744' }}>{lastDigit} ({lastDigit % 2 === 0 ? 'Even' : 'Odd'})</strong></p>}
            </div>
          )}

          {/* BARRIER for touch/turbos */}
          {['touch','turbos'].includes(ct) && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Barrier</div>
              <input value={barrier} onChange={e => setBarrier(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          {/* POTENTIAL PAYOUT */}
          {payout && (
            <div style={{ margin: '8px 12px', padding: '10px 14px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Potential Payout</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#00e676' }}>{payout}</div>
            </div>
          )}

          {/* RESULT */}
          {result && (
            <div style={{ margin: '0 12px 8px', padding: '8px 12px', borderRadius: 7, background: result.ok ? 'rgba(0,230,118,0.06)' : 'rgba(255,23,68,0.06)', border: `1px solid ${result.ok ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}` }}>
              <div style={{ fontSize: 12, color: result.ok ? '#00e676' : '#ff1744' }}>{result.msg}</div>
            </div>
          )}

          {/* OPEN CONTRACTS */}
          {openContracts.length > 0 && (
            <div style={{ margin: '0 12px 8px' }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Open Contracts</div>
              {openContracts.map(c => (
                <div key={c.id} style={{ padding: '8px 10px', borderRadius: 7, marginBottom: 4, background: c.status === 'won' ? 'rgba(0,230,118,0.06)' : c.status === 'lost' ? 'rgba(255,23,68,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${c.status === 'won' ? 'rgba(0,230,118,0.2)' : c.status === 'lost' ? 'rgba(255,23,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e8eaf0' }}>{c.type} · {c.symbol}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.status === 'won' ? '#00e676' : c.status === 'lost' ? '#ff1744' : '#ffd600' }}>
                      {c.status === 'open' ? '⏳' : c.status === 'won' ? `+$${c.profit?.toFixed(2)}` : `-$${Math.abs(c.profit || 0).toFixed(2)}`}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#4a5568', marginTop: 2 }}>Stake: ${c.stake?.toFixed(2)} · Payout: ${c.payout?.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TRADE BUTTONS — always at bottom */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {ctObj.contracts.map(c => (
              <button
                key={c.type}
                onClick={() => trade(c.type)}
                disabled={loading}
                style={btnStyle(c.color)}
              >
                {loading ? '...' : c.label}
              </button>
            ))}
          </div>
          {loading && <p style={{ textAlign: 'center', fontSize: 11, color: '#8892a4', margin: 0 }}>Placing trade...</p>}
        </div>
      </div>
    </div>
  )
}
