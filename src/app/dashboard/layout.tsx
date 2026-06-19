'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { useUserStore } from '@/store/useStore';
import { useDerivWS } from '@/hooks/useDerivWS';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  
  // Initialize WebSocket connection
  useDerivWS();

  useEffect(() => {
    const storedToken = localStorage.getItem('deriv_token');
    if (!token && !storedToken) {
      router.push('/');
    }
  }, [token, router]);

  if (!token && typeof window !== 'undefined' && !localStorage.getItem('deriv_token')) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}