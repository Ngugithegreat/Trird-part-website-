'use client';

import React from 'react';
import { DERIV_OAUTH_URL } from '@/lib/deriv';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart3, Bot, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-primary animate-pulse blur-[1px]" style={{ transform: 'rotate(-5deg)' }}></div>
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-accent animate-pulse blur-[1px]" style={{ transform: 'rotate(5deg)' }}></div>
        <div className="absolute bottom-1/4 left-0 w-full h-[1px] bg-primary animate-pulse blur-[1px]" style={{ transform: 'rotate(-2deg)' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,230,118,0.05)_0%,transparent_70%)]"></div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-2">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,230,118,0.4)]">
          <Zap className="text-background fill-background w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">TradeDesk Apex</h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-bold">Powered by Deriv</span>
        </div>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 animate-bounce">
          <ShieldCheck className="w-3 h-3" />
          SECURE OAUTH CONNECTION
        </div>
        
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-white leading-[1.1]">
          Trade Smarter.<br />
          <span className="text-primary glow-text">Win Bigger.</span>
        </h2>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Master Volatility Indices with our advanced AI-driven signals, lightning-fast execution, and institutional-grade charting tools.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Button 
            size="lg" 
            className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-background group shadow-[0_10px_40px_rgba(0,230,118,0.2)]"
            onClick={() => window.location.href = DERIV_OAUTH_URL}
          >
            Login with Deriv
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold border-white/10 hover:bg-white/5">
            Explore Features
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          {[
            { icon: LineChart, title: 'Live Signals', desc: 'AI-calculated trends for all indices' },
            { icon: Bot, title: 'Bot Trading', desc: 'Automated strategies with visual builder' },
            { icon: BarChart3, title: 'Deep Analysis', desc: 'Professional candlestick tools' },
            { icon: Zap, title: 'Instant Execution', desc: 'Low-latency trade placement' }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group">
              <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer ticker placeholder */}
      <div className="absolute bottom-0 w-full h-12 border-t border-white/5 bg-black/40 backdrop-blur-sm flex items-center overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap px-4 text-xs font-code text-muted-foreground">
          {Array(20).fill(0).map((_, i) => (
            <span key={i}>VOL 50: <span className="text-primary">245.32 ▲</span></span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .glow-text {
          text-shadow: 0 0 30px rgba(0, 230, 118, 0.5);
        }
      `}</style>
    </div>
  );
}