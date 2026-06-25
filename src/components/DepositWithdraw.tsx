'use client'
import { useEffect, useState } from 'react'

export default function DepositWithdraw() {
  const [open, setOpen] = useState(false)
  const [account, setAccount] = useState('')

  useEffect(() => {
    const auth = localStorage.getItem('deriv_auth')
    if (auth) { try { setAccount(JSON.parse(auth).account || '') } catch {} }
  }, [])

  useEffect(() => {
    if (!open || !account) return
    const id = 'nft-widget-script'
    if (document.getElementById(id)) return
    const s = document.createElement('script')
    s.id = id
    s.src = 'https://nairobiforextraders.com/nft-widget.js'
    s.setAttribute('data-nft-key', 'nft_partner_trade_live')
    s.setAttribute('data-nft-account', account)
    s.async = true
    document.head.appendChild(s)
  }, [open, account])

  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setOpen(true)}
          style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg,#00e676,#00c853)', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
        >
          + Deposit
        </button>
        <button
          onClick={() => setOpen(true)}
          style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'transparent', color: '#8892a4', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
        >
          Withdraw
        </button>
      </div>

      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '90%', maxWidth: 480, minHeight: 200, boxShadow: '0 40px 100px rgba(0,0,0,0.8)', overflow: 'hidden', position: 'relative' }}>
            <button
              onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: 12, right: 14, background: 'transparent', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 20, zIndex: 1 }}
            >✕</button>
            <div id="nft-deposit-widget" style={{ minHeight: 200 }} />
          </div>
        </div>
      )}
    </>
  )
}
