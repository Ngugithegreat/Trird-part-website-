'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Connecting your account...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token1')
    const account = params.get('acct1')
    const currency = params.get('cur1')

    console.log('CALLBACK RECEIVED:', { token: token?.slice(0,10), account, currency })

    if (!token) {
      setStatus('No token found. Redirecting...')
      setTimeout(() => router.push('/'), 2500)
      return
    }

    localStorage.setItem('deriv_token', token)
    localStorage.setItem('deriv_account', account || '')
    localStorage.setItem('deriv_currency', currency || '')

    setStatus('Authorizing with Deriv...')

    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    const timeout = setTimeout(() => { ws.close(); router.push('/dashboard') }, 10000)

    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }))

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'authorize') {
        clearTimeout(timeout)
        ws.close()
        if (d.error) {
          setStatus('Failed: ' + d.error.message)
          setTimeout(() => router.push('/'), 3000)
          return
        }
        localStorage.setItem('deriv_auth', JSON.stringify({
          token,
          account: account || d.authorize.loginid,
          currency: currency || d.authorize.currency,
          balance: d.authorize.balance,
          email: d.authorize.email,
          fullname: d.authorize.fullname,
        }))
        setStatus('Success! Loading dashboard...')
        router.push('/dashboard')
      }
    }

    ws.onerror = () => { clearTimeout(timeout); router.push('/dashboard') }
    return () => { clearTimeout(timeout); ws.close() }
  }, [router])

  return (
    <div style={{
      minHeight:'100vh', background:'#06080f',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:20, fontFamily:'Inter,sans-serif'
    }}>
      <div style={{
        width:52, height:52,
        border:'3px solid #00e676',
        borderTopColor:'transparent',
        borderRadius:'50%',
        animation:'spin 0.8s linear infinite'
      }}/>
      <p style={{color:'#8892a4',fontSize:14}}>{status}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
