'use client'
import { useEffect, useState } from 'react'

export default function BotBuilderPage() {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem('deriv_auth')
    if (auth) {
      try {
        const { token, account } = JSON.parse(auth)
        // Pass token so Deriv Bot auto-logs in — exactly like DBTraders does
        setSrc(`https://dbot.deriv.com?acct1=${account}&token1=${token}&cur1=USD`)
      } catch { setSrc('https://dbot.deriv.com') }
    } else {
      setSrc('https://dbot.deriv.com')
    }
  }, [])

  if (!src) return (
    <div style={{ height: 'calc(100vh - 52px)', background: '#06080f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #00e676', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#8892a4', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>Loading Bot Builder...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <iframe
      src={src}
      style={{ width: '100%', height: 'calc(100vh - 52px)', border: 'none', display: 'block' }}
      allow="clipboard-read; clipboard-write"
      title="Deriv Bot Builder"
    />
  )
}
