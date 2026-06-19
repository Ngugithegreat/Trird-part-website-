'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/useStore';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useUserStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token1');
    const account = searchParams.get('acct1');
    const currency = searchParams.get('cur1');

    if (token && account) {
      localStorage.setItem('deriv_token', token);
      setAuth({
        token,
        account,
        currency: currency || 'USD',
      });
      
      // Delay slightly for dramatic effect and state persistence
      setTimeout(() => {
        router.push('/dashboard/trade');
      }, 1500);
    } else {
      router.push('/');
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse"></div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Connecting Your Account</h2>
        <p className="text-muted-foreground animate-pulse">Synchronizing with Deriv secure gateway...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Suspense fallback={<div>Loading environment...</div>}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}