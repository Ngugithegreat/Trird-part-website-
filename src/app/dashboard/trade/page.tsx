'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState, useRef } from 'react'

const Chart = dynamic(() => import('@/components/TradeChart'), {
  ssr: false,
  loading: () => (
    <div style={{ flex:1,background:'#0d1117',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ width:32,height:32,border:'2px solid #00e676',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
})

const SYMS = [
  { id: 'R_10', l: 'V10', pip: 3 }, { id: 'R_25', l: 'V25', pip: 3 },
  { id: 'R_50', l: 'V50', pip: 2 }, { id: 'R_75', l: 'V75', pip: 2 },
  { id: 'R_100', l: 'V100', pip: 2 }, { id: '1HZ10V', l: 'V10s', pip: 3 },
  { id: '1HZ25V', l: 'V25s', pip: 3 }, { id: '1HZ50V', l: 'V50s', pip: 2 },
  { id: '1HZ75V', l: 'V75s', pip: 2 }, { id: '1HZ100V', l: 'V100s', pip: 2 },
]
const TFS = [{ v: 60, l: '1m' }, { v: 300, l: '5m' }, { v: 900, l: '15m' }, { v: 1800, l: '30m' }, { v: 3600, l: '1h' }, { v: 14400, l: '4h' }, { v: 86400, l: '1D' }]
const CONTRACTS = [
  { id: 'rise_fall', l: 'Rise/Fall', icon: '📈' }, { id: 'accumulators', l: 'Accumulators', icon: '📊' },
  { id: 'match_differ', l: 'Match/Differ', icon: '🎯' }, { id: 'even_odd', l: 'Even/Odd', icon: '⚖️' },
  { id: 'over_under', l: 'Over/Under', icon: '🎲' }, { id: 'touch', l: 'Touch', icon: '👆' },
  { id: 'turbos', l: 'Turbos', icon: '⚡' }, { id: 'vanillas', l: 'Vanillas', icon: '🍦' },
]
const DURS = [{ v: 1, u: 't', l: '1t' }, { v: 5, u: 't', l: '5t' }, { v: 10, u: 't', l: '10t' }, { v: 1, u: 'm', l: '1m' }, { v: 5, u: 'm', l: '5m' }, { v: 15, u: 'm', l: '15m' }, { v: 1, u: 'h', l: '1h' }]

export default function TradePage() {
  const [sym, setSym] = useState('R_50')
  const [pip, setPip] = useState(2)
  const [gran, setGran] = useState(60)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [ct, setCt] = useState('rise_fall')
  const [stake, setStake] = useState('10')
  const [dur, setDur] = useState(DURS[1])
  const [accumRate, setAccumRate] = useState(1)
  const [digit, setDigit] = useState(5)
  const [digitType, setDigitType] = useState<'DIGITMATCH' | 'DIGITDIFF'>('DIGITMATCH')
  const [barrier, setBarrier] = useState('+0.001')
  const [payout, setPayout] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => SYMS.forEach(s => ws.send(JSON.stringify({ ticks: s.id, subscribe: 1 })))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick') setPrices(p => ({ ...p, [d.tick.symbol]: parseFloat(d.tick.quote) }))
    }
    return () => ws.close()
  }, [appId])

  useEffect(() => { const s = SYMS.find(x => x.id === sym); if (s) setPip(s.pip) }, [sym])

  useEffect(() => {
    const t = setTimeout(getProposal, 600)
    return () => clearTimeout(t)
  }, [ct, stake, dur, sym, accumRate, digit, digitType, barrier])

  const getProposal = async () => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) return
    const { token } = JSON.parse(auth)
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'authorize') ws.send(JSON.stringify({ proposal: 1, ...buildParams('CALL') }))
      if (d.msg_type === 'proposal' && d.proposal) {
        const p = parseFloat(d.proposal.payout), s = parseFloat(stake)
        setPayout(`$${p.toFixed(2)} (+${Math.round((p / s - 1) * 100)}%)`)
        ws.close()
      }
      if (d.error) ws.close()
    }
    ws.onerror = () => ws.close()
  }

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

  const trade = async (ctype: string) => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) { setResult({ ok: false, msg: 'Please login first' }); return }
    const { token } = JSON.parse(auth)
    setLoading(true); setResult(null)
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'authorize') ws.send(JSON.stringify({ buy: 1, price: parseFloat(stake) || 10, parameters: buildParams(ctype) }))
      if (d.msg_type === 'buy') {
        setLoading(false)
        if (d.error) { setResult({ ok: false, msg: d.error.message }); ws.close(); return }
        setResult({ ok: true, msg: `✓ Trade placed! Contract #${d.buy.contract_id}` })
        ws.close()
      }
    }
    ws.onerror = () => { setLoading(false); setResult({ ok: false, msg: 'Connection error' }); ws.close() }
  }

  const price = prices[sym]
  const lastDigit = price ? Math.round((price % 1) * Math.pow(10, pip)) % 10 : null
  const btn = (color: string) => ({ padding: '13px', borderRadius: 9, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', opacity: loading ? 0.6 : 1, ...(color === 'green' ? { background: 'linear-gradient(135deg,#00e676,#00c853)', color: '#000' } : { background: 'linear-gradient(135deg,#ff1744,#d50000)', color: '#fff' }) } as React.CSSProperties)
  const pill = (active: boolean) => ({ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: active ? '#1c2640' : 'transparent', border: active ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)', color: active ? '#e8eaf0' : '#4a5568', cursor: 'pointer', fontFamily: 'Inter,sans-serif' } as React.CSSProperties)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', background: '#06080f', overflow: 'hidden' }}>
      {/* LEFT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Symbol tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, scrollbarWidth: 'none' }}>
          {SYMS.map(s => (
            <button key={s.id} onClick={() => setSym(s.id)} style={{ padding: '8px 14px', background: 'transparent', border: 'none', borderBottom: sym === s.id ? '2px solid #00e676' : '2px solid transparent', color: sym === s.id ? '#e8eaf0' : '#4a5568', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <span>{s.l}</span>
              {prices[s.id] && <span style={{ fontSize: 9, fontVariantNumeric: 'tabular-nums', color: sym === s.id ? '#00e676' : '#4a5568' }}>{prices[s.id].toFixed(s.pip)}</span>}
            </button>
          ))}
        </div>
        {/* TF + price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {TFS.map(tf => <button key={tf.v} onClick={() => setGran(tf.v)} style={pill(gran === tf.v)}>{tf.l}</button>)}
          {price && <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: '#e8eaf0', fontVariantNumeric: 'tabular-nums' }}>{price.toFixed(pip)}</span>}
        </div>
        {/* Chart fills ALL remaining space - no tick feed */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Chart symbol={sym} granularity={gran} />
        </div>
      </div>

      {/* RIGHT panel */}
      <div style={{ width: 290, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {/* Contract type */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Contract Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {CONTRACTS.map(c => (
                <button key={c.id} onClick={() => setCt(c.id)} style={{ padding: '6px 4px', borderRadius: 6, fontSize: 10, fontWeight: 500, background: ct === c.id ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)', border: ct === c.id ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.06)', color: ct === c.id ? '#00e676' : '#8892a4', cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <span style={{ fontSize: 12 }}>{c.icon}</span><span>{c.l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stake */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Stake (USD)</div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
              {['1', '5', '10', '25', '50', '100'].map(v => <button key={v} onClick={() => setStake(v)} style={{ flex: 1, padding: '4px 2px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: stake === v ? '#1c2640' : 'transparent', border: stake === v ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)', color: stake === v ? '#e8eaf0' : '#4a5568', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>${v}</button>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0 8px' }}>
              <span style={{ color: '#4a5568', fontSize: 13 }}>$</span>
              <input type="number" value={stake} onChange={e => setStake(e.target.value)} style={{ flex: 1, padding: '7px 4px', background: 'transparent', border: 'none', outline: 'none', color: '#e8eaf0', fontSize: 14, fontWeight: 600, fontFamily: 'Inter,sans-serif' }} />
            </div>
          </div>

          {/* Duration */}
          {['rise_fall', 'touch', 'turbos', 'vanillas'].includes(ct) && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Duration</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {DURS.map(d => <button key={d.l} onClick={() => setDur(d)} style={pill(dur.l === d.l)}>{d.l}</button>)}
              </div>
            </div>
          )}

          {/* Accumulators */}
          {ct === 'accumulators' && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Growth Rate</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4, 5].map(r => <button key={r} onClick={() => setAccumRate(r)} style={{ flex: 1, padding: '7px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: accumRate === r ? 'rgba(0,230,118,0.1)' : 'transparent', border: accumRate === r ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.06)', color: accumRate === r ? '#00e676' : '#4a5568', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{r}%</button>)}
              </div>
            </div>
          )}

          {/* Match/Differ */}
          {ct === 'match_differ' && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {(['DIGITMATCH', 'DIGITDIFF'] as const).map(t => <button key={t} onClick={() => setDigitType(t)} style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: digitType === t ? 'rgba(0,230,118,0.1)' : 'transparent', border: digitType === t ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.06)', color: digitType === t ? '#00e676' : '#4a5568', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{t === 'DIGITMATCH' ? 'Matches' : 'Differs'}</button>)}
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => <button key={d} onClick={() => setDigit(d)} style={{ flex: 1, padding: '6px 2px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: digit === d ? 'rgba(0,176,255,0.15)' : lastDigit === d ? 'rgba(255,214,0,0.1)' : 'rgba(255,255,255,0.03)', border: digit === d ? '1px solid rgba(0,176,255,0.4)' : lastDigit === d ? '1px solid rgba(255,214,0,0.3)' : '1px solid rgba(255,255,255,0.06)', color: digit === d ? '#2979ff' : lastDigit === d ? '#ffd600' : '#8892a4', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{d}</button>)}
              </div>
              {lastDigit !== null && <p style={{ fontSize: 10, color: '#4a5568', marginTop: 4 }}>Current: <strong style={{ color: '#ffd600' }}>{lastDigit}</strong></p>}
            </div>
          )}

          {/* Even/Odd info */}
          {ct === 'even_odd' && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 12, color: '#8892a4', lineHeight: 1.6 }}>Predict whether the last digit will be Even (0,2,4,6,8) or Odd (1,3,5,7,9).</p>
              {lastDigit !== null && <p style={{ fontSize: 12, color: '#4a5568', marginTop: 6 }}>Current: <strong style={{ color: lastDigit % 2 === 0 ? '#00e676' : '#ff1744' }}>{lastDigit} ({lastDigit % 2 === 0 ? 'Even' : 'Odd'})</strong></p>}
            </div>
          )}

          {/* Barrier for touch/turbos/vanillas */}
          {['touch', 'turbos', 'vanillas'].includes(ct) && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Barrier</div>
              <input value={barrier} onChange={e => setBarrier(e.target.value)} style={{ width: '100%', padding: '7px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 12, fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          {/* Payout */}
          {payout && (
            <div style={{ margin: '8px 12px', padding: '8px 12px', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.12)', borderRadius: 7 }}>
              <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Potential Payout</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#00e676' }}>{payout}</div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ margin: '0 12px 8px', padding: '8px 12px', borderRadius: 7, background: result.ok ? 'rgba(0,230,118,0.06)' : 'rgba(255,23,68,0.06)', border: `1px solid ${result.ok ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}` }}>
              <div style={{ fontSize: 11, color: result.ok ? '#00e676' : '#ff1744' }}>{result.msg}</div>
            </div>
          )}
        </div>

        {/* Trade buttons always at bottom */}
        <div style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ct === 'rise_fall' && <><button onClick={() => trade('CALL')} disabled={loading} style={{ ...btn('green'), flex: 1 }}>▲ Rise</button><button onClick={() => trade('PUT')} disabled={loading} style={{ ...btn('red'), flex: 1 }}>▼ Fall</button></>}
          {ct === 'accumulators' && <button onClick={() => trade('ACCU')} disabled={loading} style={{ ...btn('green') }}>▲ Buy Accumulator</button>}
          {ct === 'match_differ' && <><button onClick={() => trade('DIGITMATCH')} disabled={loading} style={{ ...btn('green') }}>✓ Matches {digit}</button><button onClick={() => trade('DIGITDIFF')} disabled={loading} style={{ ...btn('red') }}>✗ Differs {digit}</button></>}
          {ct === 'even_odd' && <><button onClick={() => trade('DIGITEVEN')} disabled={loading} style={{ ...btn('green') }}>Even</button><button onClick={() => trade('DIGITODD')} disabled={loading} style={{ ...btn('red') }}>Odd</button></>}
          {ct === 'over_under' && <><button onClick={() => trade('DIGITOVER')} disabled={loading} style={{ ...btn('green') }}>Over 4</button><button onClick={() => trade('DIGITUNDER')} disabled={loading} style={{ ...btn('red') }}>Under 5</button></>}
          {ct === 'touch' && <><button onClick={() => trade('ONETOUCH')} disabled={loading} style={{ ...btn('green') }}>Touch</button><button onClick={() => trade('NOTOUCH')} disabled={loading} style={{ ...btn('red') }}>No Touch</button></>}
          {ct === 'turbos' && <><button onClick={() => trade('TURBOSLONG')} disabled={loading} style={{ ...btn('green') }}>⚡ Long</button><button onClick={() => trade('TURBOSSHORT')} disabled={loading} style={{ ...btn('red') }}>⚡ Short</button></>}
          {ct === 'vanillas' && <><button onClick={() => trade('VANILLALONGCALL')} disabled={loading} style={{ ...btn('green') }}>Call</button><button onClick={() => trade('VANILLALONGPUT')} disabled={loading} style={{ ...btn('red') }}>Put</button></>}
        </div>
      </div>
    </div>
  )
}
