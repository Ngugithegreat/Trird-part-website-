'use client';

import React, { useEffect, useRef } from 'react';
import { getOAuthURL, SYMBOLS } from '@/lib/deriv';
import { useStore } from '@/store/useStore';
import { Zap, TrendingUp, Bot, ShieldCheck, ArrowRight, Layers, Search, Rocket } from 'lucide-react';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const allTicks = useStore((s) => s.allTicks);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 60;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fillStyle = '#00e676';
        ctx!.globalAlpha = 0.4;
        ctx!.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.update();
        p.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = '#2979ff';
            ctx.globalAlpha = (1 - dist / 150) * 0.2;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleLogin = () => {
    window.location.href = getOAuthURL();
  };

  return (
    <div className="relative min-h-screen bg-[#080b12] overflow-x-hidden flex flex-col">
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-transparent hover:bg-[#080b12]/90 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#00e676] to-[#2979ff] rounded-lg flex items-center justify-center font-black text-xl text-black shadow-lg">
            N
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold tracking-tight text-lg">NairobiForexTraders</span>
            <span className="text-[9px] text-[#00e676] font-black uppercase tracking-[0.2em]">Deriv Powered</span>
          </div>
        </div>
        <button 
          onClick={handleLogin}
          className="px-5 py-2 rounded-full border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all"
        >
          Login with Deriv
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pt-32 pb-20">
        <div className="mb-6">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#00e676] uppercase px-3 py-1 bg-[#00e676]/10 rounded-full border border-[#00e676]/20">
            Professional Trading Platform
          </span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 leading-[1.05]">
          Trade Smarter.<br />
          <span className="gradient-text">Win Consistently.</span>
        </h1>

        <p className="text-[#8892a4] text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-12">
          Connect your Deriv account and access professional-grade trading tools, live signals, and automated strategies — built for serious traders.
        </p>

        {/* Ticker Bar */}
        <div className="w-full max-w-4xl mx-auto mb-12 overflow-hidden bg-[#0e1420]/80 backdrop-blur-md border border-white/5 rounded-2xl h-12 flex items-center">
          <div className="flex items-center gap-12 whitespace-nowrap px-6 animate-ticker">
            {[...SYMBOLS, ...SYMBOLS].map((s, i) => (
              <div key={i} className="flex items-center gap-2 font-tabular">
                <span className="text-[11px] font-bold text-[#8892a4] uppercase">{s.short}</span>
                <span className="text-xs font-bold text-white">{allTicks[s.id]?.toFixed(s.pip) || '---'}</span>
                <span className={i % 2 === 0 ? "text-[#00e676]" : "text-[#ff1744]"}>{i % 2 === 0 ? '▲' : '▼'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleLogin}
            className="btn-primary h-14 px-10 rounded-xl text-lg flex items-center gap-3 group"
          >
            Connect Deriv Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="text-xs text-[#4a5568] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secured by Deriv OAuth 2.0 · No passwords stored
          </span>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-6xl mt-24">
          {[
            { icon: Zap, color: '#00e676', title: 'Instant Execution', desc: 'Sub-millisecond trade execution on all Volatility Indices' },
            { icon: TrendingUp, color: '#2979ff', title: 'Live Signals', desc: 'Algorithm-powered signals with confidence scoring' },
            { icon: Bot, color: '#7c4dff', title: 'Smart Bots', desc: 'Automated strategies running 24/7 on your account' },
            { icon: ShieldCheck, color: '#00e676', title: 'Secure & Regulated', desc: 'Powered by Deriv, a regulated broker with 20+ years' }
          ].map((f, i) => (
            <div key={i} className="bg-[#0e1420]/50 backdrop-blur-2xl border border-white/5 rounded-2xl p-8 text-left hover:border-[#00e676]/30 hover:-translate-y-1 transition-all duration-300">
              <f.icon className="w-10 h-10 mb-6" style={{ color: f.color }} />
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-[#8892a4] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-10 border-t border-white/5 text-center mt-auto">
        <p className="text-[#4a5568] text-xs">© 2024 NairobiForexTraders. All rights reserved. Trade at your own risk.</p>
      </footer>
    </div>
  );
}
