'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string;
  account: string;
  currency: string;
  balance: number;
  email: string;
  fullname: string;
}

interface Store {
  auth: AuthState | null;
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  connected: boolean;
  setConnected: (v: boolean) => void;
  currentSymbol: string;
  setCurrentSymbol: (s: string) => void;
  currentGranularity: number;
  setCurrentGranularity: (g: number) => void;
  tick: any;
  setTick: (t: any) => void;
  ticks: any[];
  addTick: (t: any) => void;
  candles: any[];
  setCandles: (c: any[]) => void;
  contracts: any[];
  addContract: (c: any) => void;
  updateContract: (id: number, update: any) => void;
  allTicks: Record<string, number>;
  setSymbolPrice: (sym: string, price: number) => void;
  pendingTradeType: string | null;
  setPendingTradeType: (t: string | null) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      auth: null,
      setAuth: (auth) => set({ auth }),
      clearAuth: () => { 
        localStorage.removeItem('deriv_token');
        set({ auth: null }); 
      },
      connected: false,
      setConnected: (connected) => set({ connected }),
      currentSymbol: 'R_50',
      setCurrentSymbol: (currentSymbol) => set({ currentSymbol, ticks: [], candles: [] }),
      currentGranularity: 60,
      setCurrentGranularity: (currentGranularity) => set({ currentGranularity, candles: [] }),
      tick: null,
      setTick: (tick) => set({ tick }),
      ticks: [],
      addTick: (t) => set((s) => ({ ticks: [t, ...s.ticks].slice(0, 100) })),
      candles: [],
      setCandles: (candles) => set({ candles }),
      contracts: [],
      addContract: (c) => set((s) => ({ contracts: [c, ...s.contracts].slice(0, 30) })),
      updateContract: (id, update) => set((s) => ({
        contracts: s.contracts.map(c => c.id === id ? {...c, ...update} : c)
      })),
      allTicks: {},
      setSymbolPrice: (sym, price) => set((s) => ({ allTicks: {...s.allTicks, [sym]: price} })),
      pendingTradeType: null,
      setPendingTradeType: (pendingTradeType) => set({ pendingTradeType }),
    }),
    { 
      name: 'nft-trading-store', 
      partialize: (s) => ({ auth: s.auth }) 
    }
  )
);
