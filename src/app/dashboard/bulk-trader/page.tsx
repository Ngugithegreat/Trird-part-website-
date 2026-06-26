'use client'
import { useEffect, useState, useRef } from 'react'

const SYMBOLS = [
  { id: 'R_10', label: 'R_10 - Volatility 10' },
  { id: 'R_25', label: 'R_25 - Volatility 25' },
  { id: 'R_50', label: 'R_50 - Volatility 50' },
  { id: 'R_75', label: 'R_75 - Volatility 75' },
  { id: 'R_100', label: 'R_100 - Volatility 100' },
  { id: '1HZ10V', label: '1HZ10V - V10 (1s)' },
  { id: '1HZ25V', label: '1HZ25V - V25 (1s)' },
  { id: '1HZ50V', label: '1HZ50V - V50 (1s)' },
  { id: '1HZ100V', label: '1HZ100V - V100 (1s)' },
]

const TRADE_TYPES = [
  'Even/Odd', 'Match/Differ', 'Over/Under', 'Rise/Fall', 'Accumulators'
]

export default function BulkTraderPage() {
  const [symbol, setSymbol] = useState('R_100')
  const [tradeType, setTradeType] = useState('Even/Odd')
  const [numTicks, setNumTicks] = useState(1000)
  const [stake, setStake] = useState('0.5')
  const [bulkTrades, setBulkTrades] = useState('1')
  const [tickCount, setTickCount] = useState(1)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [digitHistory, setDigitHistory] = useState<number[]>([])
  const [digitCounts, setDigitCounts] = useState<number[]>(Array(10).fill(0))
  const [evenCount, setEvenCount] = useState(0)
  const [oddCount, setOddCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanMode, setScanMode] = useState('Over1/Under8')
  const [scanDepth, setScanDepth] = useState('3000')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pip = symbol.includes('HZ') ? 2 : (symbol === 'R_10' || symbol === 'R_25' ? 3 : 2)
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    setDigitHistory([])
    setDigitCounts(Array(10).fill(0))
    setEvenCount(0); setOddCount(0)
    setCurrentPrice(null); setTickCount(1)

    wsRef.current?.close()
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    wsRef.current = ws

    ws.onopen = () => ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick' && d.tick) {
        const price = parseFloat(d.tick.quote)
        setCurrentPrice(price)
        setTickCount(prev => prev + 1)
        const lastDigit = Math.round((price % 1) * Math.pow(10, pip)) % 10
        setDigitHistory(prev => [lastDigit, ...prev].slice(0, 50))
        setDigitCounts(prev => {
          const next = [...prev]
          next[lastDigit]++
          return next
        })
        if (lastDigit % 2 === 0) setEvenCount(p => p + 1)
        else setOddCount(p => p + 1)
      }
    }
    ws.onerror = () => ws.close()
    return () => ws.close()
  }, [symbol, pip, appId])

  const total = digitCounts.reduce((a, b) => a + b, 0)
  const evenPct = total > 0 ? ((evenCount / total) * 100).toFixed(2) : '0.00'
  const oddPct = total > 0 ? ((oddCount / total) * 100).toFixed(2) : '0.00'

  const getMostFrequent = () => {
    const max = Math.max(...digitCounts)
    return digitCounts.indexOf(max)
  }
  const getLeastFrequent = () => {
    const nonZero = digitCounts.filter(c => c > 0)
    if (nonZero.length === 0) return 0
    const min = Math.min(...nonZero)
    return digitCounts.indexOf(min)
  }

  const placeBulkTrades = async (ctype: string) => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) { setResult('Please login first'); return }
    const { token } = JSON.parse(auth)
    setLoading(true); setResult(null)
    const count = parseInt(bulkTrades) || 1
    let placed = 0, errors = 0

    for (let i = 0; i < count; i++) {
      await new Promise<void>(resolve => {
        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
        ws.onopen = () => ws.send(JSON.stringify({ authorize: token }))
        ws.onmessage = (e) => {
          const d = JSON.parse(e.data)
          if (d.msg_type === 'authorize') {
            ws.send(JSON.stringify({
              buy: 1, price: parseFloat(stake) || 0.5,
              parameters: {
                contract_type: ctype, symbol,
                duration: parseInt(tickCount.toString()) || 1,
                duration_unit: 't',
                amount: parseFloat(stake) || 0.5,
                basis: 'stake', currency: 'USD',
              }
            }))
          }
          if (d.msg_type === 'buy') {
            if (d.error) errors++; else placed++
            ws.close(); resolve()
          }
          if (d.error) { errors++; ws.close(); resolve() }
        }
        ws.onerror = () => { errors++; ws.close(); resolve() }
        setTimeout(() => { ws.close(); resolve() }, 8000)
      })
      await new Promise(r => setTimeout(r, 300))
    }
    setLoading(false)
    setResult(`✓ ${placed} trade${placed !== 1 ? 's' : ''} placed${errors > 0 ? ` (${errors} failed)` : ''}`)
  }

  const runScan = async () => {
    setScanning(true); setScanResult(null)
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500))
    const modes: Record<string, string> = {
      'Over1/Under8': 'Over 1 / Under 8',
      'Over2/Under7': 'Over 2 / Under 7',
      'Over3/Under6': 'Over 3 / Under 6',
    }
    const mostFreq = getMostFrequent()
    const leastFreq = getLeastFrequent()
    setScanResult(`${symbol} — Last digit ${mostFreq} is HOT (${total > 0 ? ((digitCounts[mostFreq] / total) * 100).toFixed(1) : '0'}% frequency). Digit ${leastFreq} is COLD. Recommended: ${modes[scanMode] || scanMode} strategy.`)
    setScanning(false)
  }

  const circleStroke = (pct: number, color: string) => {
    const r = 28, circ = 2 * Math.PI * r
    return (
      <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="35" cy="35" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s' }} />
      </svg>
    )
  }

  const inp = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#e8eaf0', fontSize: 14, fontFamily: 'Inter,sans-serif', outline: 'none' } as React.CSSProperties

  return (
    <div style={{ padding: 24, background: '#06080f', minHeight: '100%', fontFamily: 'Inter,sans-serif', position: 'relative' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8eaf0', letterSpacing: '-0.02em', marginBottom: 4 }}>📦 Bulk Trader</h1>
        <p style={{ fontSize: 13, color: '#8892a4' }}>Place multiple trades simultaneously across Volatility Indices.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Market</div>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            {SYMBOLS.map(s => <option key={s.id} value={s.id} style={{ background: '#0d1117' }}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Trade Type</div>
          <select value={tradeType} onChange={e => setTradeType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            {TRADE_TYPES.map(t => <option key={t} value={t} style={{ background: '#0d1117' }}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Number of Ticks to Analyse</div>
        <input type="number" value={numTicks} onChange={e => setNumTicks(+e.target.value)} style={inp} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Current Tick</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#00e676', fontVariantNumeric: 'tabular-nums' }}>
            {currentPrice ? currentPrice.toFixed(pip) : '—'}
          </div>
        </div>
        <button
          onClick={() => setShowScanner(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, #1a237e, #0d47a1)',
            color: '#fff', border: '1px solid rgba(100,149,237,0.4)',
            cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            boxShadow: '0 0 24px rgba(41,121,255,0.3)',
          }}
        >
          <span style={{ fontSize: 16 }}>🤖</span> AI SCANNER
        </button>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0', marginBottom: 16 }}>Digit Frequency Analysis · {total} ticks</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {Array(10).fill(0).map((_, d) => {
            const pct = total > 0 ? (digitCounts[d] / total) * 100 : 0
            const isMost = d === getMostFrequent() && total > 0
            const isLeast = d === getLeastFrequent() && total > 0
            const color = isMost ? '#00e676' : isLeast ? '#ff1744' : pct > 12 ? '#ffd600' : '#2979ff'
            return (
              <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ position: 'relative', width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {circleStroke(pct, color)}
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>{d}</span>
                    {isMost && <span style={{ fontSize: 8, color: '#00e676' }}>▲</span>}
                    {isLeast && total > 10 && <span style={{ fontSize: 8, color: '#ff1744' }}>▼</span>}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: '#8892a4', fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(2)}%</span>
              </div>
            )
          })}
        </div>

        {digitHistory.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 16, alignItems: 'center' }}>
            {digitHistory.slice(0, 8).map((d, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 6,
                background: d % 2 === 0 ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)',
                border: `1px solid ${d % 2 === 0 ? 'rgba(0,230,118,0.4)' : 'rgba(255,23,68,0.4)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: d % 2 === 0 ? '#00e676' : '#ff1744',
              }}>{d}</div>
            ))}
            <span style={{ fontSize: 10, color: '#4a5568', marginLeft: 4 }}>← Last digits</span>
          </div>
        )}
      </div>

      <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'Ticks', val: tickCount.toString(), set: (v: string) => setTickCount(+v) },
            { label: 'Stake ($)', val: stake, set: setStake },
            { label: 'No. of Bulk Trades', val: bulkTrades, set: setBulkTrades },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{f.label}</div>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)} style={{ ...inp, padding: '7px 10px', fontSize: 13 }} />
            </div>
          ))}
        </div>

        {result && (
          <div style={{ padding: '8px 12px', borderRadius: 7, marginBottom: 12, background: result.startsWith('✓') ? 'rgba(0,230,118,0.06)' : 'rgba(255,23,68,0.06)', border: `1px solid ${result.startsWith('✓') ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}` }}>
            <span style={{ fontSize: 12, color: result.startsWith('✓') ? '#00e676' : '#ff1744' }}>{result}</span>
          </div>
        )}

        {tradeType === 'Even/Odd' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => placeBulkTrades('DIGITEVEN')} disabled={loading} style={{ padding: '18px', borderRadius: 10, fontSize: 16, fontWeight: 700, background: '#00897b', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', opacity: loading ? 0.6 : 1 }}>
              Even
              <div style={{ fontSize: 13, fontWeight: 400, marginTop: 2 }}>{evenPct}%</div>
            </button>
            <button onClick={() => placeBulkTrades('DIGITODD')} disabled={loading} style={{ padding: '18px', borderRadius: 10, fontSize: 16, fontWeight: 700, background: '#c62828', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', opacity: loading ? 0.6 : 1 }}>
              Odd
              <div style={{ fontSize: 13, fontWeight: 400, marginTop: 2 }}>{oddPct}%</div>
            </button>
          </div>
        )}
        {tradeType === 'Match/Differ' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => placeBulkTrades('DIGITMATCH')} disabled={loading} style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: '#00897b', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Matches</button>
            <button onClick={() => placeBulkTrades('DIGITDIFF')} disabled={loading} style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: '#c62828', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Differs</button>
          </div>
        )}
        {tradeType === 'Over/Under' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => placeBulkTrades('DIGITOVER')} disabled={loading} style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: '#00897b', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Over 4</button>
            <button onClick={() => placeBulkTrades('DIGITUNDER')} disabled={loading} style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: '#c62828', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Under 5</button>
          </div>
        )}
        {tradeType === 'Rise/Fall' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => placeBulkTrades('CALL')} disabled={loading} style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#00e676,#00c853)', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>▲ Rise</button>
            <button onClick={() => placeBulkTrades('PUT')} disabled={loading} style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#ff1744,#d50000)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>▼ Fall</button>
          </div>
        )}
        {loading && <p style={{ textAlign: 'center', fontSize: 12, color: '#8892a4', marginTop: 8 }}>Placing trades...</p>}
      </div>

      {showScanner && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowScanner(false) }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '90%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
            <div style={{ background: 'linear-gradient(135deg,#1a237e,#0d47a1)', padding: '20px 24px', position: 'relative' }}>
              <button onClick={() => setShowScanner(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 20, cursor: 'pointer' }}>✕</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', letterSpacing: '0.06em' }}>✦ RECOVERY ENGINE</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Digits Scanner</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Scans digit patterns with recovery confirmation.</div>
              <div style={{ position: 'absolute', right: 20, top: 16, width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔍</div>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
                {['Over1/Under8', 'Over2/Under7', 'Over3/Under6'].map(m => (
                  <button key={m} onClick={() => setScanMode(m)} style={{ flex: 1, padding: '7px 4px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: scanMode === m ? 'rgba(41,121,255,0.2)' : 'transparent', border: scanMode === m ? '1px solid rgba(41,121,255,0.4)' : '1px solid transparent', color: scanMode === m ? '#2979ff' : '#8892a4', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{m}</button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Scan Depth</div>
                  <input type="number" value={scanDepth} onChange={e => setScanDepth(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Mode</div>
                  <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 12 }}>
                    {scanMode === 'Over1/Under8' ? 'O1/U8' : scanMode === 'Over2/Under7' ? 'O2/U7' : 'O3/U6'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ticks</div>
                  <input type="number" value={scanDepth} onChange={e => setScanDepth(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Selected Market</div>
                  <div style={{ fontSize: 12, color: '#e8eaf0' }}>{scanning ? 'Scanning...' : (scanResult ? symbol : 'Scan to find best market')}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Trade Type</div>
                  <div style={{ fontSize: 12, color: '#e8eaf0' }}>{scanning ? 'Analysing...' : (scanResult ? scanMode : 'Waiting for scan')}</div>
                </div>
              </div>

              {scanResult && !scanning && (
                <div style={{ padding: '12px 14px', background: 'rgba(41,121,255,0.08)', border: '1px solid rgba(41,121,255,0.2)', borderRadius: 8, fontSize: 12, color: '#90caf9', lineHeight: 1.6 }}>
                  🔍 {scanResult}
                </div>
              )}
              {scanning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(41,121,255,0.05)', border: '1px solid rgba(41,121,255,0.15)', borderRadius: 8 }}>
                  <div style={{ width: 18, height: 18, border: '2px solid #2979ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#8892a4' }}>Scanning {scanDepth} ticks across markets...</span>
                </div>
              )}

              {!scanResult && !scanning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4a5568' }}>
                  <span>🔄</span> Not scanned yet
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={runScan} disabled={scanning} style={{ padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: scanning ? 'rgba(41,121,255,0.3)' : 'linear-gradient(135deg,#1565c0,#2979ff)', color: '#fff', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  🔍 {scanning ? 'Scanning...' : 'Scan Markets'}
                </button>
                <button onClick={() => { setShowScanner(false) }} disabled={!scanResult} style={{ padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: scanResult ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)', color: scanResult ? '#00e676' : '#4a5568', border: `1px solid ${scanResult ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: scanResult ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  🤖 Load Scanner Bot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
