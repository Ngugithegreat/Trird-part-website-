'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function CallbackPage() {
  const router = useRouter();
  const { setAuth } = useStore();
  const initialized = useRef(false);
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token1');
    const account = params.get('acct1');
    const currency = params.get('cur1');
    
    if (!token) {
      router.push('/');
      return;
    }
    
    const ws = new WebSocket(
      `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`
    );

    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.msg_type === 'authorize' && !data.error) {
        setAuth({
          token,
          account: account || data.authorize.loginid,
          currency: currency || data.authorize.currency,
          balance: data.authorize.balance,
          email: data.authorize.email,
          fullname: data.authorize.fullname,
        });
        localStorage.setItem('deriv_token', token);
        ws.close();
        router.push('/dashboard');
      } else if (data.error) {
        ws.close();
        router.push('/?error=auth_failed');
      }
    };

    ws.onerror = () => router.push('/?error=connection_failed');

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [router, setAuth]);
  
  return (
    <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-[3px] border-[#00e676] border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
        <h2 className="text-white font-bold text-xl mb-1 tracking-tight">Authenticating Account</h2>
        <p className="text-[#8892a4] text-sm animate-pulse">Establishing secure connection with Deriv...</p>
      </div>
    </div>
  );
}
