'use client'
import { useState, useEffect } from 'react'

interface Account { loginid: string; token: string; currency: string; is_virtual: boolean; balance?: number }

export default function AccountSwitcher({ onSwitch }: { onSwitch?: (a: Account) => void }) {
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [active, setActive] = useState<Account | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227'

  useEffect(() => {
    const auth = localStorage.getItem('deriv_auth')
    if (!auth) return
    const data = JSON.parse(auth)
    const accts: Account[] = data.all_accounts || [{ loginid: data.account, token: data.token, currency: data.currency, is_virtual: false }]
    setAccounts(accts)
    const saved = localStorage.getItem('deriv_active_account')
    setActive(saved ? JSON.parse(saved) : (accts.find(a => !a.is_virtual) || accts[0]))
  }, [])

  const switchAccount = (acc: Account) => {
    setLoading(acc.loginid); setOpen(false)
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`)
    ws.onopen = () => ws.send(JSON.stringify({ authorize: acc.token }))
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.msg_type === 'authorize' && !d.error) {
        const updated = { ...acc, balance: d.authorize.balance, currency: d.authorize.currency || acc.currency, loginid: d.authorize.loginid }
        setActive(updated)
        localStorage.setItem('deriv_active_account', JSON.stringify(updated))
        const auth = localStorage.getItem('deriv_auth')
        if (auth) {
          const p = JSON.parse(auth)
          Object.assign(p, { token: acc.token, account: updated.loginid, balance: updated.balance, currency: updated.currency })
          localStorage.setItem('deriv_auth', JSON.stringify(p))
          localStorage.setItem('deriv_token', acc.token)
        }
        onSwitch?.(updated); ws.close(); setLoading(null)
      }
      if (d.error) { ws.close(); setLoading(null) }
    }
    ws.onerror = () => { ws.close(); setLoading(null) }
  }

  if (!active) return null
  const isDemo = active.is_virtual || active.loginid?.startsWith('VR') || active.loginid?.startsWith('VRTC')

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 8, background: isDemo ? 'rgba(124,77,255,0.12)' : 'rgba(0,230,118,0.08)', border: `1px solid ${isDemo ? 'rgba(124,77,255,0.3)' : 'rgba(0,230,118,0.2)'}`, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
        {loading ? <div style={{ width:12,height:12,border:'2px solid #00e676',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/> : <div style={{ width:7,height:7,borderRadius:'50%',background: isDemo?'#7c4dff':'#00e676' }}/>}
        <div style={{ textAlign:'left' }}>
          <div style={{ fontSize:11,fontWeight:700,color:isDemo?'#7c4dff':'#00e676' }}>{isDemo?'DEMO':active.loginid}</div>
          <div style={{ fontSize:10,color:'#8892a4',fontVariantNumeric:'tabular-nums' }}>{active.balance !== undefined ? `${active.balance.toFixed(2)} ${active.currency||'USD'}` : active.currency||'USD'}</div>
        </div>
        <span style={{ fontSize:10,color:'#4a5568' }}>{open?'▲':'▼'}</span>
      </button>

      {open && (
        <div style={{ position:'absolute',top:'calc(100% + 6px)',right:0,background:'#0d1117',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:8,minWidth:220,zIndex:1000,boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize:10,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.08em',padding:'4px 8px 8px' }}>Switch Account</div>

          {accounts.filter(a=>!a.is_virtual).length>0 && <>
            <div style={{ fontSize:9,color:'#4a5568',padding:'2px 8px 4px',textTransform:'uppercase' }}>Real</div>
            {accounts.filter(a=>!a.is_virtual).map(acc=>(
              <button key={acc.loginid} onClick={()=>switchAccount(acc)} style={{ width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,border:'none',background:active.loginid===acc.loginid?'rgba(0,230,118,0.08)':'transparent',cursor:'pointer',fontFamily:'Inter,sans-serif',textAlign:'left' }}>
                <div style={{ width:32,height:32,borderRadius:8,background:'rgba(0,230,118,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#00e676' }}>{acc.loginid?.slice(0,2).toUpperCase()}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:'#e8eaf0' }}>{acc.loginid}</div>
                  <div style={{ fontSize:10,color:'#4a5568' }}>{acc.currency||'USD'} · Real</div>
                </div>
                {active.loginid===acc.loginid && <span style={{ color:'#00e676' }}>✓</span>}
              </button>
            ))}
          </>}

          {accounts.filter(a=>a.is_virtual).length>0 && <>
            <div style={{ fontSize:9,color:'#4a5568',padding:'8px 8px 4px',textTransform:'uppercase',borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:4 }}>Demo</div>
            {accounts.filter(a=>a.is_virtual).map(acc=>(
              <button key={acc.loginid} onClick={()=>switchAccount(acc)} style={{ width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,border:'none',background:active.loginid===acc.loginid?'rgba(124,77,255,0.08)':'transparent',cursor:'pointer',fontFamily:'Inter,sans-serif',textAlign:'left' }}>
                <div style={{ width:32,height:32,borderRadius:8,background:'rgba(124,77,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#7c4dff' }}>D</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:'#e8eaf0' }}>{acc.loginid}</div>
                  <div style={{ fontSize:10,color:'#7c4dff' }}>Demo · Free practice</div>
                </div>
                {active.loginid===acc.loginid && <span style={{ color:'#7c4dff' }}>✓</span>}
              </button>
            ))}
          </>}

          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:6,paddingTop:6 }}>
            <button onClick={()=>{localStorage.removeItem('deriv_auth');localStorage.removeItem('deriv_token');window.location.href='/'}} style={{ width:'100%',padding:'7px 10px',borderRadius:7,border:'none',background:'transparent',color:'#ff1744',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'Inter,sans-serif',textAlign:'left' }}>⎋ Logout</button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
