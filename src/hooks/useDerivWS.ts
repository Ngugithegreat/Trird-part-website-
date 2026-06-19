'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUserStore, useTradingStore } from '@/store/useStore';
import { VOLATILITY_INDICES } from '@/lib/symbols';

export function useDerivWS() {
  const ws = useRef<WebSocket | null>(null);
  const { token, setBalance, authorized } = useUserStore();
  const { currentSymbol, addTick, setPrice } = useTradingStore();
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${process.env.NEXT_PUBLIC_DERIV_APP_ID}`;
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log('Deriv WS Connected');
      if (token) {
        socket.send(JSON.stringify({ authorize: token }));
      }
      
      // Subscribe to all prices for the ticker
      VOLATILITY_INDICES.forEach(index => {
        socket.send(JSON.stringify({ ticks: index.symbol }));
      });
      
      // Keep alive
      setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ ping: 1 }));
        }
      }, 30000);
    };

    socket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      
      if (data.msg_type === 'authorize' && data.authorize) {
        setBalance(data.authorize.balance);
      }

      if (data.msg_type === 'tick' && data.tick) {
        if (data.tick.symbol === currentSymbol) {
          addTick({
            quote: data.tick.quote,
            epoch: data.tick.epoch,
            symbol: data.tick.symbol
          });
        } else {
          setPrice(data.tick.symbol, data.tick.quote);
        }
      }

      if (data.msg_type === 'proposal' && data.proposal) {
        // Handle proposal feedback here if needed
      }
    };

    socket.onclose = () => {
      console.log('Deriv WS Disconnected. Retrying...');
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current = socket;
  }, [token, currentSymbol, addTick, setPrice, setBalance]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = (data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  return { send };
}
