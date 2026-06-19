'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Info, ChevronDown } from 'lucide-react';
import { SignalDirection } from '@/lib/signals';

interface SignalCardProps {
  symbol: string;
  name: string;
  rank: number;
  direction: SignalDirection;
  confidence: number;
  underFive: boolean;
}

export function SignalCard({ symbol, name, rank, direction, confidence, underFive }: SignalCardProps) {
  const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
  const rankIcons = ['#1', '#2', '#3'];

  return (
    <Card className="bg-card border border-border/50 hover:border-primary/50 transition-all group overflow-hidden shadow-xl">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <span className={cn("text-lg font-black italic", rank <= 3 ? rankColors[rank-1] : "text-muted-foreground")}>
              {rank <= 3 ? rankIcons[rank-1] : `#${rank}`}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">{name.replace('Index', '')}</span>
              <span className="text-[10px] font-code text-muted-foreground">{symbol}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {underFive && <Badge className="bg-primary/20 text-primary border-none text-[9px] font-bold">UNDER $5</Badge>}
            {direction === 'CALL' ? 
              <TrendingUp className="w-5 h-5 text-primary" /> : 
              <TrendingDown className="w-5 h-5 text-destructive" />
            }
          </div>
        </div>

        {/* Confidence Section */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
            <span>Confidence</span>
            <span className={confidence > 80 ? "text-primary" : "text-foreground"}>{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-1.5 bg-secondary" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-1">
          {[
            { label: 'UNDER 5%', value: '72%' },
            { label: 'MOST', value: 'CALL' },
            { label: 'LEAST', value: 'PUT' }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-0.5 p-2 rounded bg-secondary/30 border border-white/5">
              <span className="text-[8px] text-muted-foreground font-bold">{stat.label}</span>
              <span className="text-[10px] font-black">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="pt-2 flex flex-col gap-2">
          <Button variant="ghost" className="h-8 w-full text-[10px] font-bold text-muted-foreground hover:bg-secondary flex items-center gap-1">
            Show Analysis Details <ChevronDown className="w-3 h-3" />
          </Button>
          <Button className={cn(
            "w-full h-11 font-black text-xs tracking-widest uppercase shadow-lg",
            direction === 'CALL' ? "bg-primary text-background" : "bg-destructive text-white"
          )}>
            Load {direction === 'CALL' ? 'Rise' : 'Fall'} Signal
          </Button>
        </div>
      </div>
    </Card>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}