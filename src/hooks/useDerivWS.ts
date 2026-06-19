'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { SYMBOLS } from '@/lib/deriv';

const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`;

export function useDerivWS() {
  const ws = useRef<WebSocket | null>(null);
  const pingRef = useRef<any>(null);
  const reconnectRef = useRef<any>(null);
  const mounted = useRef(true);
  
  const { 
    setConnected, setTick, addTick, setCandles, 
    addContract, updateContract, setSymbolPrice,
  } = useStore();

  const send = useCallback((payload: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  }, []);

  const subscribeSymbol = useCallback((symbol: string, gran: number) => {
    send({ forget_all: 'ticks' });
    send({ forget_all: 'candles' });
    send({ ticks: symbol, subscribe: 1 });
    const end = Math.floor(Date.now() / 1000);
    send({ 
      ticks_history: symbol, 
      style: 'candles', 
      granularity: gran, 
      end, 
      count: 250, 
      subscribe: 1 
    });
    // Subscribe all symbols for price ticker
    SYMBOLS.forEach(s => {
      if (s.id !== symbol) send({ ticks: s.id, subscribe: 1 });
    });
  }, [send]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);
    
    ws.current.onopen = () => {
      if (!mounted.current) return;
      setConnected(true);
      const { auth: a, currentSymbol: sym, currentGranularity: gran } = useStore.getState();
      if (a?.token) send({ authorize: a.token });
      subscribeSymbol(sym, gran);
      pingRef.current = setInterval(() => send({ ping: 1 }), 25000);
    };

    ws.current.onmessage = (e) => {
      if (!mounted.current) return;
      const data = JSON.parse(e.data);
      
      if (data.msg_type === 'tick') {
        const t = data.tick;
        const price = parseFloat(t.quote);
        const state = useStore.getState();
        
        setSymbolPrice(t.symbol, price);
        
        if (t.symbol === state.currentSymbol) {
          setTick({ quote: price, epoch: t.epoch, symbol: t.symbol, pip_size: t.pip_size || 2 });
          addTick({ price, epoch: t.epoch });
          
          if (state.candles.length > 0) {
            const gran = state.currentGranularity;
            const candleTime = Math.floor(t.epoch / gran) * gran;
            const last = state.candles[state.candles.length - 1];
            
            if (last.time === candleTime) {
              const updated = { ...last, close: price, high: Math.max(last.high, price), low: Math.min(last.low, price) };
              setCandles([...state.candles.slice(0, -1), updated]);
            } else {
              const newCandle = { time: candleTime, open: price, high: price, low: price, close: price };
              setCandles([...state.candles, newCandle]);
            }
          }
        }
      }

      if (data.msg_type === 'candles') {
        setCandles(data.candles.map((c: any) => ({
          time: c.epoch, open: +c.open, high: +c.high, low: +c.low, close: +c.close
        })));
      }

      if (data.msg_type === 'buy') {
        if (!data.error) {
          addContract({
            id: data.buy.contract_id,
            type: useStore.getState().pendingTradeType || 'CALL',
            stake: data.buy.buy_price,
            payout: data.buy.payout,
            status: 'open',
            profit: 0,
            symbol: useStore.getState().currentSymbol,
            entry: data.buy.start_time
          });
        }
      }

      if (data.msg_type === 'proposal_open_contract') {
        const p = data.proposal_open_contract;
        if (p?.contract_id) updateContract(p.contract_id, {
          profit: p.profit,
          currentSpot: p.current_spot,
          status: p.is_sold ? (p.profit >= 0 ? 'won' : 'lost') : 'open'
        });
      }

      if (data.msg_type === 'authorize' && !data.error) {
        useStore.getState().setAuth({
          ...useStore.getState().auth!,
          balance: data.authorize.balance,
          email: data.authorize.email,
          fullname: data.authorize.fullname,
        });
      }
    };

    ws.current.onclose = () => {
      if (!mounted.current) return;
      setConnected(false);
      clearInterval(pingRef.current);
      reconnectRef.current = setTimeout(connect, 4000);
    };
    ws.current.onerror = () => ws.current?.close();
  }, [send, subscribeSymbol, setConnected, setTick, addTick, setCandles, addContract, updateContract, setSymbolPrice]);

  const placeTrade = useCallback((params: any) => {
    const { auth: a, currentSymbol: sym } = useStore.getState();
    if (!a?.token) return;
    
    useStore.getState().setPendingTradeType(params.contract_type);
    
    send({
      buy: 1,
      price: params.amount,
      parameters: {
        contract_type: params.contract_type,
        symbol: params.symbol || sym,
        duration: params.duration,
        duration_unit: params.duration_unit,
        amount: params.amount,
        basis: 'stake',
        currency: a.currency || 'USD',
        ...(params.growth_rate && { growth_rate: params.growth_rate }),
        ...(params.selected_tick !== undefined && { selected_tick: params.selected_tick }),
      }
    });
  }, [send]);

  const changeSymbol = useCallback((sym: string, gran?: number) => {
    const state = useStore.getState();
    const g = gran || state.currentGranularity;
    state.setCurrentSymbol(sym);
    subscribeSymbol(sym, g);
  }, [subscribeSymbol]);

  useEffect(() => {
    mounted.current = true;
    connect();
    return () => {
      mounted.current = false;
      clearInterval(pingRef.current);
      clearTimeout(reconnectRef.current);
      ws.current?.close();
    };
  }, [connect]);

  return { placeTrade, changeSymbol, send };
}
