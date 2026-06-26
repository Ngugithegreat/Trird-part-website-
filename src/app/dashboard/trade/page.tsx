'use client'
import { useEffect, useState } from 'react'

export default function ManualTraderPage() {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) { window.location.href = '/'; return }
    try {
      const { token, account, currency } = JSON.parse(auth)
      const cur = (currency || 'USD').toUpperCase()
      // Build URL exactly like DBTraders/Deriv DTrader
      const params = new URLSearchParams({
        acct1: account,
        token1: token,
        cur1: cur,
        chart_type: 'area',
        interval: '1t',
        symbol: '1HZ100V',
        trade_type: 'rise_fall',
      })
      setSrc(`https://app.deriv.com/dtrader?${params.toString()}`)
    } catch {
      window.location.href = '/'
    }
  }, [])

  if (!src) return (
    <div style={{ height: 'calc(100vh - 96px)', background: '#06080f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #00e676', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#8892a4', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>Loading Manual Trader...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ height: 'calc(100vh - 96px)', width: '100%', overflow: 'hidden' }}>
      <iframe
        src={src}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="clipboard-read; clipboard-write; storage-access"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-downloads"
        title="Deriv Manual Trader"
      />
    </div>
  )
}
