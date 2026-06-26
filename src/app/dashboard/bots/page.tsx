'use client'
import { useEffect, useRef, useState } from 'react'

export default function BotBuilderPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [authSent, setAuthSent] = useState(false)
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

      // Method 1: Pass via URL fragment (hash) — some Deriv apps read this
      // Method 2: postMessage after load
      // Use the accounts URL format that Deriv's own redirect uses
      const url = new URL('https://dbot.deriv.com')
      url.searchParams.set('acct1', account)
      url.searchParams.set('token1', token)
      url.searchParams.set('cur1', cur)
      // Also set in hash for legacy support
      url.hash = `acct1=${account}&token1=${token}&cur1=${cur}`
      
      setSrc(url.toString())

      // Store for postMessage
      ;(window as any).__derivAuth = { token, account, currency: cur }

    } catch {
      window.location.href = '/'
    }
  }, [])

  // Send auth via postMessage when iframe loads
  const handleIframeLoad = () => {
    if (!iframeRef.current || authSent) return
    const auth = (window as any).__derivAuth
    if (!auth) return

    // Send the token to the iframe using postMessage
    // Deriv's dbot listens for this message format
    try {
      iframeRef.current.contentWindow?.postMessage({
        type: 'authorize',
        token: auth.token,
        acct1: auth.account,
        cur1: auth.currency,
      }, 'https://dbot.deriv.com')

      // Also try the LOGIN_REDIRECT message format Deriv uses internally
      iframeRef.current.contentWindow?.postMessage({
        key: 'login',
        value: JSON.stringify([{
          acct: auth.account,
          token: auth.token,
          cur: auth.currency,
        }])
      }, '*')

      setAuthSent(true)
    } catch (e) {
      console.log('postMessage failed:', e)
    }
  }

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
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 20, padding: '4px 16px', fontSize: 12, color: '#00e676', fontFamily: 'Inter,sans-serif', fontWeight: 500, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          ✓ {botName} — Select "Quick Strategy" in the bot builder to configure
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={src}
        onLoad={handleIframeLoad}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="clipboard-read; clipboard-write; storage-access; cross-origin-isolated"
        title="Deriv Bot Builder"
      />
    </div>
  )
}
