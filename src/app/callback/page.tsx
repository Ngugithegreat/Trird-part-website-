'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Connecting your Deriv account...')

  useEffect(() => {
    // Must use window.location.search directly - not useSearchParams to avoid static bailouts
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token1')
    const account = params.get('acct1')
    const currency = params.get('cur1')

    console.log('Callback params:', { token: token?.slice(0, 8) + '...', account, currency })

    if (!token) {
      setStatus('No token received. Redirecting...')
      setTimeout(() => router.push('/'), 2000)
      return
    }

    // Save token immediately to localStorage
    localStorage.setItem('deriv_token', token)
    if (account) localStorage.setItem('deriv_account', account)
    if (currency) localStorage.setItem('deriv_currency', currency)

    setStatus('Authorizing with Deriv...')

    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)

    const timeout = setTimeout(() => {
      setStatus('Connection timeout. Redirecting...')
      ws.close()
      router.push('/dashboard')
    }, 10000)

    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: token }))
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      console.log('WS response:', data.msg_type, data.error?.message)

      if (data.msg_type === 'authorize') {
        clearTimeout(timeout)
        ws.close()

        if (data.error) {
          setStatus('Authorization failed: ' + data.error.message)
          setTimeout(() => router.push('/'), 3000)
          return
        }

        // Save full auth data for persistence
        const authData = {
          token,
          account: account || data.authorize.loginid,
          currency: currency || data.authorize.currency,
          balance: data.authorize.balance,
          email: data.authorize.email,
          fullname: data.authorize.fullname,
        }
        localStorage.setItem('deriv_auth', JSON.stringify(authData))
        
        setStatus('Success! Loading your dashboard...')
        router.push('/dashboard')
      }
    }

    ws.onerror = (err) => {
      console.error('WS error:', err)
      clearTimeout(timeout)
      // Still redirect - token is saved, dashboard will re-authorize via hook
      router.push('/dashboard')
    }

    ws.onclose = () => clearTimeout(timeout)

    return () => {
      clearTimeout(timeout)
      ws.close()
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080b12',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: '3px solid #00e676',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ color: '#8892a4', fontSize: 14 }}>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
