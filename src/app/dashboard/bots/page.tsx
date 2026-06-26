'use client'
import { useEffect, useState } from 'react'

export default function BotBuilderPage() {
  const [src, setSrc] = useState<string | null>(null)
  const [botName, setBotName] = useState<string | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) { window.location.href = '/'; return }

    try {
      const { token, account, currency } = JSON.parse(auth)
      const cur = (currency || 'USD').toUpperCase()

      const loadBot = localStorage.getItem('load_bot')
      if (loadBot) {
        const bot = JSON.parse(loadBot)
        setBotName(bot.name)
        localStorage.removeItem('load_bot')
      }

      // app.deriv.com/bot shares cookies with app.deriv.com login
      // Pass token in the URL — Deriv's app reads acct1/token1 from params
      const params = new URLSearchParams({
        acct1: account,
        token1: token,
        cur1: cur,
      })

      // Use app.deriv.com/bot — this is the same dbot but on the 
      // authenticated domain that already has the session cookie
      setSrc(`https://app.deriv.com/bot?${params.toString()}`)

    } catch {
      window.location.href = '/'
    }
  }, [])

  if (!src) return (
    <div style={{ height: 'calc(100vh - 96px)', background: '#06080f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'Inter,sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #00e676', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#8892a4', fontSize: 13 }}>{botName ? `Loading ${botName}...` : 'Loading Bot Builder...'}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 96px)', width: '100%', overflow: 'hidden' }}>
      {botName && (
        <div style={{
          position: 'absolute', top: 10, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          background: 'rgba(0,230,118,0.1)',
          border: '1px solid rgba(0,230,118,0.3)',
          borderRadius: 20, padding: '4px 16px',
          fontSize: 12, color: '#00e676',
          fontFamily: 'Inter,sans-serif', fontWeight: 500,
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          ✓ {botName} — Use Quick Strategy to configure and run
        </div>
      )}
      <iframe
        src={src}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="clipboard-read; clipboard-write; storage-access"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-downloads"
        title="Deriv Bot Builder"
      />
    </div>
  )
}
