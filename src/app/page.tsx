'use client';
import { useEffect, useRef, useState } from 'react';
import { startDerivLogin } from '@/lib/deriv';

const SYMBOLS = [
  { s: 'V10', p: 1124.38 }, { s: 'V25', p: 2584.55 },
  { s: 'V50', p: 90.06 }, { s: 'V75', p: 38163.31 },
  { s: 'V100', p: 340.42 }, { s: 'V10s', p: 9855.11 },
  { s: 'V25s', p: 781.88 }, { s: 'V50s', p: 94.58 },
];

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prices, setPrices] = useState(SYMBOLS);

  // Particle network animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    let raf: number;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,230,118,0.5)';
        ctx.fill();
        pts.forEach((q) => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,176,255,${0.15 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((s) => ({ ...s, p: s.p + s.p * (Math.random() - 0.5) * 0.001 }))
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ 
      fontFamily: 'Inter, sans-serif', 
      background: '#06080f', 
      color: '#e8eaf0', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Particle canvas background */}
      <canvas ref={canvasRef} style={{ 
        position: 'fixed', top: 0, left: 0, 
        width: '100%', height: '100%', 
        zIndex: 0, opacity: 0.6, pointerEvents: 'none' 
      }} />

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 100, height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 32px', gap: 16,
        background: 'rgba(6,8,15,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg,#00e676,#00b0ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15, color: '#000'
          }}>N</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>NairobiForexTraders</div>
            <div style={{ fontSize: 9, color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Deriv Powered</div>
          </div>
        </div>

        {/* Scrolling ticker */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', margin: '0 16px' }}>
          <div style={{
            display: 'flex', animation: 'ticker 20s linear infinite',
            whiteSpace: 'nowrap'
          }}>
            {[...prices, ...prices].map((s, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0 20px', fontSize: 11, fontWeight: 500,
                borderRight: '1px solid rgba(255,255,255,0.06)'
              }}>
                <span style={{ color: '#8892a4' }}>{s.s}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.p.toFixed(2)}</span>
                <span style={{ color: '#00e676', fontSize: 9 }}>▲</span>
              </span>
            ))}
          </div>
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => startDerivLogin()} style={{
            padding: '7px 18px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e8eaf0', borderRadius: 8, fontSize: 13,
            fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif'
          }}>Log In</button>
          <button onClick={() => startDerivLogin()} style={{
            padding: '7px 18px',
            background: 'linear-gradient(135deg,#00e676,#00b0ff)',
            border: 'none', color: '#000', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter,sans-serif'
          }}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        position: 'relative', zIndex: 5,
        textAlign: 'center', padding: '140px 32px 80px',
        maxWidth: 700, margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,230,118,0.08)',
          border: '1px solid rgba(0,230,118,0.2)',
          borderRadius: 20, padding: '5px 14px',
          fontSize: 11, fontWeight: 500, color: '#00e676',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: 28
        }}>
          <span style={{ 
            width: 6, height: 6, borderRadius: '50%',
            background: '#00e676', display: 'inline-block',
            animation: 'pulse 2s infinite'
          }} />
          Professional Trading Platform
        </div>

        <h1 style={{ 
          fontSize: 64, fontWeight: 800, letterSpacing: '-0.03em',
          lineHeight: 1.05, marginBottom: 20 
        }}>
          Trade Smarter.<br />
          <span style={{
            background: 'linear-gradient(90deg,#00e676,#00b0ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Win Consistently.</span>
        </h1>

        <p style={{ 
          fontSize: 17, color: '#8892a4', marginBottom: 40, 
          lineHeight: 1.7, maxWidth: 500, margin: '0 auto 40px' 
        }}>
          Connect your Deriv account and access professional-grade trading tools, 
          live signals, and automated strategies — built for serious traders.
        </p>

        <button onClick={() => startDerivLogin()} style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '18px 40px',
          background: 'linear-gradient(135deg,#00e676,#00b0ff)',
          color: '#000', borderRadius: 14, fontSize: 17,
          fontWeight: 700, cursor: 'pointer', border: 'none',
          fontFamily: 'Inter,sans-serif', letterSpacing: '-0.01em',
          boxShadow: '0 0 40px rgba(0,230,118,0.25)',
          transition: 'transform 0.15s'
        }}>
          ⚡ Connect Deriv Account →
        </button>

        <p style={{ 
          fontSize: 12, color: '#4a5568', marginTop: 14 
        }}>
          🔒 Secured by Deriv OAuth 2.0 · No passwords stored · 100% Free
        </p>
      </section>

      {/* STATS ROW */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(6,8,15,0.8)'
      }}>
        {[
          { val: '10+', lbl: 'Volatility Indices' },
          { val: '24/7', lbl: 'Market Hours' },
          { val: '0%', lbl: 'Markup Commission' },
          { val: '1000+', lbl: 'Active Traders' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '24px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none'
          }}>
            <div style={{ 
              fontSize: 28, fontWeight: 700, color: '#00e676',
              letterSpacing: '-0.02em' 
            }}>{s.val}</div>
            <div style={{ 
              fontSize: 11, color: '#4a5568', marginTop: 4,
              textTransform: 'uppercase', letterSpacing: '0.06em' 
            }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* FEATURES SECTION */}
      <section style={{ 
        position: 'relative', zIndex: 5,
        padding: '60px 48px', maxWidth: 1100, margin: '0 auto' 
      }}>
        <div style={{ 
          fontSize: 11, color: '#00e676', letterSpacing: '0.1em',
          textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 
        }}>Platform Features</div>
        <h2 style={{ 
          fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em',
          marginBottom: 40 
        }}>
          Everything you need{' '}
          <span style={{ color: '#8892a4' }}>to trade professionally.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { icon: '📈', color: 'rgba(0,230,118,0.1)', name: 'Manual Trading', desc: 'Rise/Fall, Accumulators, Touch, Digits — full control' },
            { icon: '🤖', color: 'rgba(0,176,255,0.1)', name: 'Smart Bots', desc: 'Automated strategies running 24/7 on your account' },
            { icon: '⚡', color: 'rgba(124,77,255,0.1)', name: 'Live Signals', desc: 'Algorithm signals with confidence scoring updated live' },
            { icon: '👥', color: 'rgba(255,214,0,0.1)', name: 'Copy Trading', desc: 'Copy top traders automatically with one click' },
          ].map((f, i) => (
            <div key={i} style={{
              background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '24px 20px',
              transition: 'border-color 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(0,230,118,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.06)')}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: f.color, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 14
              }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </main>
  );
}