'use client'
import { useEffect, useState } from 'react'

const SYMBOLS = [
  { id: 'R_10', label: 'V10' },
  { id: 'R_25', label: 'V25' },
  { id: 'R_50', label: 'V50' },
  { id: 'R_75', label: 'V75' },
  { id: 'R_100', label: 'V100' },
  { id: '1HZ10V', label: 'V10 (1s)' },
  { id: '1HZ25V', label: 'V25 (1s)' },
  { id: '1HZ50V', label: 'V50 (1s)' },
  { id: '1HZ75V', label: 'V75 (1s)' },
  { id: '1HZ100V', label: 'V100 (1s)' },
]

const TRADE_TYPES = [
  { id: 'rise_fall', label: 'Rise/Fall', param: 'rise_fall' },
  { id: 'accumulators', label: 'Accumulators', param: 'accumulator' },
  { id: 'match_differ', label: 'Match/Differ', param: 'match_diff' },
  { id: 'even_odd', label: 'Even/Odd', param: 'even_odd' },
  { id: 'over_under', label: 'Over/Under', param: 'over_under' },
  { id: 'touch', label: 'Touch/No Touch', param: 'touch' },
  { id: 'turbos', label: 'Turbos', param: 'turbos' },
  { id: 'vanillas', label: 'Vanillas', param: 'vanillas' },
]

export default function ManualTraderPage() {
  const [src, setSrc] = useState<string | null>(null)
  const [selectedSym, setSelectedSym] = useState('1HZ100V')
  const [selectedType, setSelectedType] = useState('rise_fall')
  const [ready, setReady] = useState(false)

  const buildSrc = (sym: string, type: string) => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) return null
    try {
      const { token, account, currency } = JSON.parse(auth)
      const cur = (currency || 'USD').toUpperCase()
      const tradeType = TRADE_TYPES.find(t => t.id === type)?.param || 'rise_fall'

      // app.deriv.com/dtrader — loads Deriv's own trader on the user's account
      // chart_type=area gives the tick line chart
      // interval=1t gives per-tick updates (fast moving)
      const params = new URLSearchParams({
        acct1: account,
        token1: token,
        cur1: cur,
        chart_type: 'area',
        interval: '1t',
        symbol: sym,
        trade_type: tradeType,
      })
      return `https://app.deriv.com/dtrader?${params.toString()}`
    } catch {
      return null
    }
  }

  useEffect(() => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) { window.location.href = '/'; return }
    const url = buildSrc(selectedSym, selectedType)
    if (url) { setSrc(url); setReady(true) }
  }, [])

  const handleSymbolChange = (sym: string) => {
    setSelectedSym(sym)
    const url = buildSrc(sym, selectedType)
    if (url) setSrc(url)
  }

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    const url = buildSrc(selectedSym, type)
    if (url) setSrc(url)
  }

  if (!src) return (
    <div style={{ height: 'calc(100vh - 96px)', background: '#06080f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'Inter,sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #00e676', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#8892a4', fontSize: 13 }}>Loading Manual Trader...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)', background: '#06080f' }}>
      {/* Our symbol + trade type selector bar on top */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: '#0d1117',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {/* Symbols */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', borderRight: '1px solid rgba(255,255,255,0.06)', flex: 1 }}>
          {SYMBOLS.map(s => (
            <button
              key={s.id}
              onClick={() => handleSymbolChange(s.id)}
              style={{
                padding: '9px 14px', background: 'transparent', border: 'none',
                borderBottom: selectedSym === s.id ? '2px solid #00e676' : '2px solid transparent',
                color: selectedSym === s.id ? '#e8eaf0' : '#4a5568',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif', flexShrink: 0,
              }}
            >{s.label}</button>
          ))}
        </div>

        {/* Trade types */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
          {TRADE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => handleTypeChange(t.id)}
              style={{
                padding: '9px 12px', background: 'transparent', border: 'none',
                borderBottom: selectedType === t.id ? '2px solid #00e676' : '2px solid transparent',
                color: selectedType === t.id ? '#00e676' : '#4a5568',
                fontSize: 11, fontWeight: 500, cursor: 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif', flexShrink: 0,
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Deriv DTrader iframe — full user session, their account, their trades */}
      <iframe
        src={src}
        style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
        allow="clipboard-read; clipboard-write; storage-access"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-downloads"
        title="Manual Trader"
      />
    </div>
  )
}
