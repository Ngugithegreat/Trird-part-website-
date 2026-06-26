'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FREE_BOTS = [
  {
    id: 'martingale_rise_fall',
    name: 'Martingale Rise/Fall',
    icon: '📊',
    symbol: 'R_50',
    symbolLabel: 'Volatility 50',
    strategy: 'Martingale',
    contractType: 'rise_fall',
    stake: '1',
    duration: '1',
    risk: 'High',
    riskColor: '#ff1744',
    winRate: 48,
    trades: 8821,
    desc: 'Classic Martingale on V50. Doubles stake after each loss. Best for experienced traders.',
    dbotUrl: 'https://dbot.deriv.com/?strategy=martingale',
  },
  {
    id: 'dalembert',
    name: "D'Alembert Strategy",
    icon: '📈',
    symbol: '1HZ10V',
    symbolLabel: 'Volatility 10 (1s)',
    strategy: "D'Alembert",
    contractType: 'rise_fall',
    stake: '1',
    duration: '1',
    risk: 'Medium',
    riskColor: '#ffd600',
    winRate: 51,
    trades: 5432,
    desc: "Safer than Martingale. Increases stake by 1 unit after loss, decreases after win.",
    dbotUrl: 'https://dbot.deriv.com/?strategy=dalembert',
  },
  {
    id: 'digit_even_odd',
    name: 'Even/Odd Sniper',
    icon: '⚖️',
    symbol: '1HZ10V',
    symbolLabel: 'Volatility 10 (1s)',
    strategy: 'Flat',
    contractType: 'even_odd',
    stake: '0.50',
    duration: '1',
    risk: 'Low',
    riskColor: '#00e676',
    winRate: 52,
    trades: 12043,
    desc: 'Trades Even/Odd digits on V10 (1s). Low risk flat betting. Great for beginners.',
    dbotUrl: 'https://dbot.deriv.com/?strategy=digit_even_odd',
  },
  {
    id: 'digit_differ',
    name: 'Digit Differs Loop',
    icon: '🎯',
    symbol: '1HZ10V',
    symbolLabel: 'Volatility 10 (1s)',
    strategy: 'Flat',
    contractType: 'match_differ',
    stake: '0.35',
    duration: '1',
    risk: 'Low',
    riskColor: '#00e676',
    winRate: 54,
    trades: 15032,
    desc: 'Trades Digit Differs on last observed digit. Very fast 1-tick contracts on V10 (1s).',
    dbotUrl: 'https://dbot.deriv.com/?strategy=digit_differ',
  },
  {
    id: 'over_under',
    name: 'Over/Under 5',
    icon: '🎲',
    symbol: '1HZ25V',
    symbolLabel: 'Volatility 25 (1s)',
    strategy: "D'Alembert",
    contractType: 'over_under',
    stake: '1',
    duration: '1',
    risk: 'Medium',
    riskColor: '#ffd600',
    winRate: 50,
    trades: 7201,
    desc: 'Over 4 / Under 5 strategy on V25 (1s). Adapts stake based on D\'Alembert system.',
    dbotUrl: 'https://dbot.deriv.com/?strategy=over_under',
  },
  {
    id: 'accumulator_1pct',
    name: '1% Accumulator',
    icon: '🔼',
    symbol: 'R_50',
    symbolLabel: 'Volatility 50',
    strategy: 'Accumulator',
    contractType: 'accumulators',
    stake: '5',
    duration: '0',
    risk: 'Medium',
    riskColor: '#ffd600',
    winRate: 61,
    trades: 921,
    desc: 'Accumulator with 1% growth rate on V50. Exits automatically at barrier breach.',
    dbotUrl: 'https://dbot.deriv.com/?strategy=accumulator',
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Rise/Fall',
    icon: '🌀',
    symbol: 'R_25',
    symbolLabel: 'Volatility 25',
    strategy: 'Fibonacci',
    contractType: 'rise_fall',
    stake: '1',
    duration: '5',
    risk: 'Medium',
    riskColor: '#ffd600',
    winRate: 49,
    trades: 3421,
    desc: 'Follows Fibonacci sequence for stake sizing. 5-tick contracts on V25.',
    dbotUrl: 'https://dbot.deriv.com/?strategy=fibonacci',
  },
  {
    id: 'anti_martingale',
    name: 'Anti-Martingale',
    icon: '🚀',
    symbol: 'R_100',
    symbolLabel: 'Volatility 100',
    strategy: 'Anti-Martingale',
    contractType: 'rise_fall',
    stake: '1',
    duration: '1',
    risk: 'High',
    riskColor: '#ff1744',
    winRate: 45,
    trades: 4832,
    desc: 'Doubles stake after each WIN to ride winning streaks. V100 1-tick contracts.',
    dbotUrl: 'https://dbot.deriv.com/?strategy=anti_martingale',
  },
]

export default function FreeBotsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All')

  const filtered = filter === 'All' ? FREE_BOTS : FREE_BOTS.filter(b => b.risk === filter)

  const loadInBotBuilder = (bot: typeof FREE_BOTS[0]) => {
    localStorage.setItem('load_bot', JSON.stringify(bot))
    router.push('/dashboard/bots')
  }

  return (
    <div style={{ padding: 24, background: '#06080f', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8eaf0', letterSpacing: '-0.02em', marginBottom: 4 }}>🎁 Free Bots</h1>
          <p style={{ fontSize: 13, color: '#8892a4' }}>Pre-built trading bots. Click <strong style={{ color: '#00e676' }}>Run in Bot Builder</strong> to load and run on your account.</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['All', 'Low', 'Medium', 'High'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: filter === f ? 'rgba(0,230,118,0.1)' : 'transparent', border: filter === f ? '1px solid rgba(0,230,118,0.25)' : '1px solid rgba(255,255,255,0.08)', color: filter === f ? '#00e676' : '#8892a4', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              {f === 'All' ? 'All' : f + ' Risk'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#00e676' }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <span>Click <strong>"Run in Bot Builder"</strong> to open the bot in Deriv Bot Builder where you can review it, adjust settings, and click Run to start trading.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(bot => (
          <div key={bot.id} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${bot.riskColor}30`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${bot.riskColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{bot.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0' }}>{bot.name}</div>
                  <div style={{ fontSize: 11, color: '#4a5568' }}>{bot.symbolLabel}</div>
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: `${bot.riskColor}15`, color: bot.riskColor, border: `1px solid ${bot.riskColor}30`, flexShrink: 0 }}>{bot.risk} Risk</span>
            </div>

            <p style={{ fontSize: 12, color: '#8892a4', lineHeight: 1.6, margin: 0 }}>{bot.desc}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { l: 'Strategy', v: bot.strategy },
                { l: 'Win Rate', v: `${bot.winRate}%` },
                { l: 'Stake', v: `$${bot.stake}` },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginTop: 2 }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => loadInBotBuilder(bot)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg,#00e676,#00c853)', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                ▶ Run in Bot Builder
              </button>
              <a
                href={bot.dbotUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892a4', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
