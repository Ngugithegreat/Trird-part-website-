'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AccountSwitcher from '@/components/AccountSwitcher'
import DepositWithdraw from '@/components/DepositWithdraw'

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/bots', icon: '🤖', label: 'Bot Builder' },
  { href: '/dashboard/free-bots', icon: '🎁', label: 'Free Bots' },
  { href: '/dashboard/speedbot', icon: '🚀', label: 'Speedbot' },
  { href: '/dashboard/apex-bot', icon: '⚡', label: 'Apex Bot' },
  { href: '/dashboard/trade', icon: '📈', label: 'Manual Trader' },
  { href: '/dashboard/bulk-trader', icon: '📦', label: 'Bulk Trader' },
  { href: '/dashboard/signals', icon: '🔔', label: 'Live Signals' },
  { href: '/dashboard/analysis', icon: '🔍', label: 'Analysis Tools' },
  { href: '/dashboard/copy-trader', icon: '👥', label: 'Copy Trader' },
]

const TICKER_SYMS = [
  { id: 'R_10', l: 'V10', pip: 3 }, { id: 'R_25', l: 'V25', pip: 3 },
  { id: 'R_50', l: 'V50', pip: 2 }, { id: 'R_75', l: 'V75', pip: 2 },
  { id: 'R_100', l: 'V100', pip: 2 }, { id: '1HZ10V', l: 'V10s', pip: 3 },
  { id: '1HZ25V', l: 'V25s', pip: 3 }, { id: '1HZ50V', l: 'V50s', pip: 2 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [auth, setAuth] = useState<any>(null)
  const [prices, setPrices] = useState<Record<string, { p: number; up: boolean }>>({})
  const [connected, setConnected] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [currency, setCurrency] = useState('USD')
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    const saved = localStorage.getItem('deriv_auth')
    if (!saved) { router.push('/'); return }
    const data = JSON.parse(saved)
    setAuth(data)
    setBalance(data.balance ?? null)
    setCurrency(data.currency || 'USD')
  }, [router])

  // Live price ticker
  useEffect(() => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => { setConnected(true); TICKER_SYMS.forEach(s => ws.send(JSON.stringify({ ticks: s.id, subscribe: 1 }))) }
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick') {
        const p = parseFloat(d.tick.quote)
        setPrices(prev => ({ ...prev, [d.tick.symbol]: { p, up: (prev[d.tick.symbol]?.p ?? p) <= p } }))
      }
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => ws.close()
    return () => ws.close()
  }, [appId])

  // Balance live update
  useEffect(() => {
    if (!auth?.token) return
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => ws.send(JSON.stringify({ authorize: auth.token }))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'authorize' && !d.error) {
        setBalance(d.authorize.balance)
        setCurrency(d.authorize.currency || 'USD')
        ws.send(JSON.stringify({ balance: 1, subscribe: 1 }))
      }
      if (d.msg_type === 'balance') setBalance(d.balance.balance)
    }
    ws.onerror = () => ws.close()
    return () => ws.close()
  }, [auth, appId])

  if (!auth) return (
    <div style={{ minHeight: '100vh', background: '#06080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #00e676', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const initials = (auth.fullname?.split(' ').map((n: string) => n[0]).join('') || auth.account?.slice(0, 2) || 'U').toUpperCase().slice(0, 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#06080f', fontFamily: 'Inter,sans-serif', overflow: 'hidden' }}>

      {/* ── TOP BAR 1: Logo + ticker + balance + account ── */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00e676,#00b0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#000' }}>N</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', letterSpacing: '-0.02em', lineHeight: 1 }}>NairobiForexTraders</div>
            <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deriv Powered</div>
          </div>
        </div>

        {/* Reports link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/dashboard')}>
          <span style={{ fontSize: 12 }}>📋</span>
          <span style={{ fontSize: 12, color: '#8892a4' }}>Reports</span>
        </div>

        {/* Live ticker */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minWidth: 0 }}>
          <div style={{ display: 'flex', animation: 'ticker 30s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
            {[...TICKER_SYMS, ...TICKER_SYMS].map((s, i) => {
              const d = prices[s.id]
              return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 14px', fontSize: 11, fontWeight: 500, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#4a5568' }}>{s.l}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: '#e8eaf0' }}>{d ? d.p.toFixed(s.pip) : '—'}</span>
                  <span style={{ fontSize: 9, color: d?.up ? '#00e676' : '#ff1744' }}>{d?.up ? '▲' : '▼'}</span>
                </span>
              )
            })}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <DepositWithdraw />
          {/* Balance */}
          {balance !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#00e676' : '#4a5568', animation: connected ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0', fontVariantNumeric: 'tabular-nums' }}>{balance.toFixed(2)}</span>
              <span style={{ fontSize: 11, color: '#4a5568' }}>{currency}</span>
            </div>
          )}
          <AccountSwitcher onSwitch={(acc) => { setBalance(acc.balance ?? null); setCurrency(acc.currency || 'USD') }} />
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(0,230,118,0.25),rgba(0,176,255,0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#00e676', border: '1px solid rgba(0,230,118,0.25)', cursor: 'pointer', flexShrink: 0 }}>
            {initials}
          </div>
        </div>
      </div>

      {/* ── TOP BAR 2: Horizontal nav tabs ── */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', background: '#0a0c12', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none', paddingLeft: 4 }}>
        {NAV.map(item => {
          const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 16px', height: '100%', whiteSpace: 'nowrap',
                background: active ? 'rgba(0,230,118,0.08)' : 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid #00e676' : '2px solid transparent',
                color: active ? '#e8eaf0' : '#8892a4',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0, minHeight: 0 }}>
        {children}
      </main>

      <style>{`
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 4px; height: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px }
        main::-webkit-scrollbar { width: 4px }
      `}</style>
    </div>
  )
}