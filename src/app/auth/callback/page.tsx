'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface DerivAccount {
  loginid: string
  token: string
  currency?: string
  is_virtual?: boolean
}

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing'|'success'|'error'|'no_accounts'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Read ALL accounts Deriv sends back (up to 10)
        const accounts: DerivAccount[] = []
        for (let i = 1; i <= 10; i++) {
          const loginid = searchParams.get(`acct${i}`)
          const token = searchParams.get(`token${i}`)
          const currency = searchParams.get(`cur${i}`) || 'USD'
          if (!loginid || !token) break
          const is_virtual = loginid.startsWith('VRTC') || loginid.startsWith('VR') || loginid.startsWith('VRW')
          accounts.push({ loginid: loginid.toUpperCase(), token, is_virtual, currency })
        }

        if (accounts.length === 0) {
          setStatus('no_accounts')
          setTimeout(() => router.push('/'), 3000)
          return
        }

        // Prefer real accounts over virtual/demo
        const realAccounts = accounts.filter(a => !a.is_virtual)
        const chosen = realAccounts.length > 0 ? realAccounts[0] : accounts[0]

        const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'
        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)

        const authData = await new Promise<any>((resolve, reject) => {
          const t = setTimeout(() => { ws.close(); reject(new Error('Timeout')) }, 10000)
          ws.onopen = () => ws.send(JSON.stringify({ authorize: chosen.token }))
          ws.onmessage = (e) => {
            const d = JSON.parse(e.data)
            if (d.error) { clearTimeout(t); ws.close(); reject(new Error(d.error.message)); return }
            if (d.msg_type === 'authorize') { clearTimeout(t); ws.close(); resolve(d.authorize) }
          }
          ws.onerror = () => { clearTimeout(t); ws.close(); reject(new Error('WebSocket error')) }
        })

        // Save full auth to localStorage
        localStorage.setItem('deriv_auth', JSON.stringify({
          token: chosen.token,
          account: authData.loginid,
          currency: authData.currency,
          balance: authData.balance,
          email: authData.email,
          fullname: authData.fullname,
          all_accounts: accounts, // <-- this is the key addition
        }))
        localStorage.setItem('deriv_token', chosen.token)
        localStorage.setItem('deriv_loginid', authData.loginid)
        localStorage.setItem('is_logged_in', 'true')

        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 800)

      } catch (err: any) {
        setErrorMsg(err.message || 'Connection failed')
        setStatus('error')
      }
    }

    processAuth()
  }, [searchParams, router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06080f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      fontFamily: 'Inter, sans-serif',
    }}>
      {(status === 'processing') && (
        <>
          <div style={{
            width: 52, height: 52,
            border: '3px solid #00e676',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: '#8892a4', fontSize: 14 }}>
            Connecting your Deriv account...
          </p>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{
            width: 52, height: 52,
            background: 'rgba(0,230,118,0.1)',
            border: '2px solid #00e676',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>✓</div>
          <p style={{ color: '#00e676', fontSize: 14 }}>
            Account connected! Loading dashboard...
          </p>
        </>
      )}
      {status === 'no_accounts' && (
        <>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <p style={{ color: '#ff1744', fontSize: 14 }}>
            No accounts found. Redirecting...
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: 32 }}>❌</div>
          <p style={{ color: '#ff1744', fontSize: 14 }}>{errorMsg}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '10px 24px',
              background: '#00e676',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to Login
          </button>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight:'100vh', background:'#06080f',
        display:'flex', alignItems:'center', justifyContent:'center'
      }}>
        <div style={{
          width:52, height:52,
          border:'3px solid #00e676',
          borderTopColor:'transparent',
          borderRadius:'50%',
          animation:'spin 0.8s linear infinite'
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
