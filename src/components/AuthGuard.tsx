'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { auth } = useStore();
  
  useEffect(() => {
    const token = localStorage.getItem('deriv_token');
    if (!auth && !token) {
      router.push('/');
    }
  }, [auth, router]);
  
  if (!auth) {
    return (
      <div className="min-h-screen bg-[#080b12] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00e676] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return <>{children}</>;
}
