import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tick {
  quote: number;
  epoch: number;
  symbol: string;
}

interface UserState {
  token: string | null;
  account: string | null;
  currency: string | null;
  balance: number;
  authorized: boolean;
  setAuth: (data: { token: string; account: string; currency: string }) => void;
  setBalance: (balance: number) => void;
  logout: () => void;
}

interface TradingState {
  currentSymbol: string;
  currentGranularity: number;
  ticks: Tick[];
  prices: Record<string, number>;
  addTick: (tick: Tick) => void;
  setPrice: (symbol: string, price: number) => void;
  setSymbol: (symbol: string) => void;
  setGranularity: (granularity: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      account: null,
      currency: null,
      balance: 0,
      authorized: false,
      setAuth: (data) => set({ ...data, authorized: true }),
      setBalance: (balance) => set({ balance }),
      logout: () => set({ token: null, account: null, currency: null, balance: 0, authorized: false }),
    }),
    { name: 'tradedesk-user-session' }
  )
);

export const useTradingStore = create<TradingState>((set) => ({
  currentSymbol: 'R_50',
  currentGranularity: 60,
  ticks: [],
  prices: {},
  addTick: (tick) => set((state) => ({ 
    ticks: [tick, ...state.ticks].slice(0, 100),
    prices: { ...state.prices, [tick.symbol]: tick.quote }
  })),
  setPrice: (symbol, price) => set((state) => ({
    prices: { ...state.prices, [symbol]: price }
  })),
  setSymbol: (symbol) => set({ currentSymbol: symbol, ticks: [] }),
  setGranularity: (granularity) => set({ currentGranularity: granularity }),
}));