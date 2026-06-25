'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const QUICK = [
  { href: '/dashboard/bots', icon: '🤖', title: 'Bot Builder', desc: 'Build and run automated trading bots', color: '#00e676' },
  { href: '/dashboard/free-bots', icon: '🎁', title: 'Free Bots', desc: 'Browse ready-made trading strategies', color: '#2979ff' },
  { href: '/dashboard/trade', icon: '📈', title: 'Manual Trader', desc: 'Trade manually with full control', color: '#7c4dff' },
  { href: '/dashboard/apex-bot', icon: '⚡', title: 'Apex Bot', desc: 'Advanced automated trading engine', color: '#ffd600' },
]

const RECENT_BOTS = [
  { name: 'Martingale V50', symbol: 'R_50', strategy: 'Martingale', lastRun: '2h ago', profit: '+$12.40', up: true },
  { name: 'Even/Odd Sniper', symbol: '1HZ10V', strategy: 'Flat Betting', lastRun: '5h ago', profit: '+$4.20', up: true },
  { name: 'V100 Scalper', symbol: 'R_100', strategy: "D'Alembert", lastRun: 'Yesterday', profit: '-$2.10', up: false },
]

export default function DashboardHome() {
  const router = useRouter()
  const [auth, setAuth] = useState<any>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [time, setTime] = useState(new Date())
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    const saved = localStorage.getItem('deriv_auth')
    if (saved) setAuth(JSON.parse(saved))
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    const syms = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100']
    ws.onopen = () => syms.forEach(s => ws.send(JSON.stringify({ ticks: s, subscribe: 1 })))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'tick') setPrices(p => ({ ...p, [d.tick.symbol]: parseFloat(d.tick.quote) }))
    }
    ws.onerror = () => ws.close()
    return () => ws.close()
  }, [appId])

  const firstName = auth?.fullname?.split(' ')[0] || auth?.account || 'Trader'
  const hour = time.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const marketCards = [
    { id: 'R_10', label: 'Volatility 10', pip: 3, color: '#00e676' },
    { id: 'R_25', label: 'Volatility 25', pip: 3, color: '#2979ff' },
    { id: 'R_50', label: 'Volatility 50', pip: 2, color: '#7c4dff' },
    { id: 'R_75', label: 'Volatility 75', pip: 2, color: '#ffd600' },
    { id: 'R_100', label: 'Volatility 100', pip: 2, color: '#ff7043' },
  ]

  return (
    <div style={{ padding: 24, background: '#06080f', minHeight: '100%' }}>
      {/* Greeting hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,230,118,0.08) 0%, rgba(0,176,255,0.06) 50%, rgba(124,77,255,0.06) 100%)',
        border: '1px solid rgba(0,230,118,0.12)',
        borderRadius: 16, padding: '32px 32px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 60, width: 150, height: 150, borderRadius: '50%', background: 'rgba(0,176,255,0.04)', border: '1px solid rgba(0,176,255,0.08)' }} />

        <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 6, fontWeight: 500 }}>
          {time.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.03em', marginBottom: 6, lineHeight: 1.1 }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ fontSize: 15, color: '#8892a4', marginBottom: 0 }}>
          Your Ultimate Deriv Trading Companion. Welcome back to NairobiForexTraders.
        </p>

        {/* Balance summary */}
        {auth?.balance !== undefined && (
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <div style={{ padding: '10px 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Balance</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#00e676', fontVariantNumeric: 'tabular-nums' }}>
                {parseFloat(auth.balance).toFixed(2)} {auth.currency || 'USD'}
              </div>
            </div>
            <div style={{ padding: '10px 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Account</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e8eaf0' }}>{auth.account}</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12 }}>QUICK ACTIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {QUICK.map(q => (
            <button
              key={q.href}
              onClick={() => router.push(q.href)}
              style={{
                background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: 20, textAlign: 'left',
                cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${q.color}40`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${q.color}08` }} />
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${q.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{q.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>{q.title}</div>
              <div style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5, marginBottom: 12 }}>{q.desc}</div>
              <div style={{ fontSize: 12, color: q.color, fontWeight: 500 }}>Open →</div>
            </button>
          ))}
        </div>
      </div>

      {/* Live market overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Market prices */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e676', animation: 'pulse 1.5s infinite' }} />
            Live Market Prices
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {marketCards.map(m => (
              <div key={m.id} onClick={() => router.push('/dashboard/trade')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#e8eaf0' }}>{m.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', fontVariantNumeric: 'tabular-nums' }}>
                  {prices[m.id] ? prices[m.id].toFixed(m.pip) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bots */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0' }}>Recent Bots</div>
            <button onClick={() => router.push('/dashboard/bots')} style={{ fontSize: 11, color: '#00e676', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RECENT_BOTS.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(0,230,118,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0' }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: '#4a5568' }}>{b.symbol} · {b.strategy} · {b.lastRun}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: b.up ? '#00e676' : '#ff1744' }}>{b.profit}</div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/dashboard/bots')} style={{ width: '100%', marginTop: 12, padding: '9px', borderRadius: 8, background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', color: '#00e676', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            + Create New Bot
          </button>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
