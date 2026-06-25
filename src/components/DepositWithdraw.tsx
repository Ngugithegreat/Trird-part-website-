'use client'
import { useEffect, useState } from 'react'

export default function DepositWithdraw() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'deposit'|'withdraw'>('deposit')
  const [account, setAccount] = useState('')

  useEffect(() => {
    const auth = localStorage.getItem('deriv_auth')
    if (auth) { try { setAccount(JSON.parse(auth).account||'') } catch {} }
  }, [])

  useEffect(() => {
    if (!open || !account) return
    const id = 'nft-widget-script'
    if (document.getElementById(id)) return
    const s = document.createElement('script')
    s.id = id
    s.src = 'https://nairobiforextraders.com/nft-widget.js'
    s.setAttribute('data-nft-key','nft_partner_trade_live')
    s.setAttribute('data-nft-account', account)
    s.async = true
    document.head.appendChild(s)
  }, [open, account])

  return (
    <>
      <div style={{ display:'flex',gap:6 }}>
        <button onClick={()=>{setTab('deposit');setOpen(true)}} style={{ padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,background:'linear-gradient(135deg,#00e676,#00c853)',color:'#000',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif' }}>+ Deposit</button>
        <button onClick={()=>{setTab('withdraw');setOpen(true)}} style={{ padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,background:'transparent',color:'#8892a4',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',fontFamily:'Inter,sans-serif' }}>Withdraw</button>
      </div>

      {open && (
        <div onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ background:'#0d1117',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,width:'90%',maxWidth:460,boxShadow:'0 40px 100px rgba(0,0,0,0.8)',overflow:'hidden' }}>
            <div style={{ padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ display:'flex',gap:4,background:'rgba(255,255,255,0.05)',borderRadius:8,padding:3 }}>
                {(['deposit','withdraw'] as const).map(t=>(
                  <button key={t} onClick={()=>setTab(t)} style={{ padding:'5px 16px',borderRadius:6,fontSize:12,fontWeight:600,background:tab===t?(t==='deposit'?'rgba(0,230,118,0.15)':'rgba(255,23,68,0.12)'):'transparent',border:tab===t?`1px solid ${t==='deposit'?'rgba(0,230,118,0.3)':'rgba(255,23,68,0.2)'}`:'1px solid transparent',color:tab===t?(t==='deposit'?'#00e676':'#ff1744'):'#4a5568',cursor:'pointer',fontFamily:'Inter,sans-serif',textTransform:'capitalize' }}>{t}</button>
                ))}
              </div>
              <button onClick={()=>setOpen(false)} style={{ background:'transparent',border:'none',color:'#4a5568',cursor:'pointer',fontSize:18 }}>✕</button>
            </div>

            <div style={{ padding:18 }}>
              <div id="nft-deposit-widget">
                <div style={{ padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,marginBottom:14 }}>
                  <div style={{ fontSize:10,color:'#4a5568',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em' }}>Account</div>
                  <div style={{ fontSize:14,fontWeight:600,color:'#e8eaf0' }}>{account||'Loading...'}</div>
                </div>

                {tab==='deposit' ? <>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14 }}>
                    {[['📱','M-Pesa','Kenya shillings'],['💳','Card','Visa / Mastercard'],['🏦','Bank Transfer','Local bank'],['₿','Crypto','BTC, ETH, USDT']].map(([icon,label,sub])=>(
                      <button key={label as string} style={{ padding:'10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',cursor:'pointer',fontFamily:'Inter,sans-serif',textAlign:'left' }}>
                        <div style={{ fontSize:18,marginBottom:4 }}>{icon}</div>
                        <div style={{ fontSize:12,fontWeight:600,color:'#e8eaf0' }}>{label}</div>
                        <div style={{ fontSize:10,color:'#4a5568' }}>{sub}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{ padding:'10px 14px',background:'rgba(0,230,118,0.06)',border:'1px solid rgba(0,230,118,0.15)',borderRadius:10,fontSize:12,color:'#00e676',marginBottom:12 }}>💡 Deposits processed instantly. Minimum: $5</div>
                  <a href="https://app.deriv.com/cashier/deposit" target="_blank" rel="noopener noreferrer" style={{ display:'block',padding:'13px',borderRadius:10,background:'linear-gradient(135deg,#00e676,#00c853)',color:'#000',fontWeight:700,fontSize:14,textAlign:'center',textDecoration:'none',fontFamily:'Inter,sans-serif' }}>Continue to Deposit →</a>
                </> : <>
                  <div style={{ padding:'10px 14px',background:'rgba(255,214,0,0.06)',border:'1px solid rgba(255,214,0,0.15)',borderRadius:10,fontSize:12,color:'#ffd600',marginBottom:12 }}>⚠️ Withdrawals processed within 1-3 business days.</div>
                  <a href="https://app.deriv.com/cashier/withdrawal" target="_blank" rel="noopener noreferrer" style={{ display:'block',padding:'13px',borderRadius:10,background:'rgba(255,23,68,0.12)',color:'#ff1744',border:'1px solid rgba(255,23,68,0.2)',fontWeight:700,fontSize:14,textAlign:'center',textDecoration:'none',fontFamily:'Inter,sans-serif' }}>Continue to Withdraw →</a>
                </>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
