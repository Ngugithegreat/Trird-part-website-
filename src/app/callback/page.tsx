'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Connecting your Deriv account...');

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const error = params.get('error');

      if (error) {
        setStatus('Login was cancelled or denied.');
        setTimeout(() => router.push('/'), 2500);
        return;
      }

      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      if (!code || !returnedState || returnedState !== storedState || !codeVerifier) {
        setStatus('Security check failed. Please try logging in again.');
        setTimeout(() => router.push('/'), 2500);
        return;
      }

      setStatus('Exchanging authorization code...');

      try {
        const res = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, codeVerifier }),
        });
        const data = await res.json();

        if (!res.ok || !data.access_token) {
          setStatus('Authorization failed: ' + (data.error || 'unknown error'));
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');

        setStatus('Authorizing with Deriv...');

        const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '108227';
        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);

        const timeout = setTimeout(() => {
          ws.close();
          router.push('/dashboard');
        }, 10000);

        ws.onopen = () => {
          ws.send(JSON.stringify({ authorize: data.access_token }));
        };

        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.msg_type === 'authorize') {
            clearTimeout(timeout);
            ws.close();
            if (msg.error) {
              setStatus('Authorization failed: ' + msg.error.message);
              setTimeout(() => router.push('/'), 3000);
              return;
            }
            localStorage.setItem(
              'deriv_auth',
              JSON.stringify({
                token: data.access_token,
                account: msg.authorize.loginid,
                currency: msg.authorize.currency,
                balance: msg.authorize.balance,
                email: msg.authorize.email,
                fullname: msg.authorize.fullname,
              })
            );
            setStatus('Success! Loading dashboard...');
            router.push('/dashboard');
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          router.push('/dashboard');
        };
      } catch (err) {
        setStatus('Network error. Please try again.');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    run();
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080b12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid #00e676',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#8892a4', fontSize: 14 }}>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
