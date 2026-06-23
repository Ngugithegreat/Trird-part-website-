'use client';
/**
 * @fileOverview Integrates the Deriv Bot Builder via an iframe.
 */
import { useEffect, useState } from 'react'

export default function BotBuilderPage() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Component mount logic
    setLoaded(true)
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 56px)',
      background: '#06080f'
    }}>
      {/* Header bar */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: '#0d1117'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0' }}>
              Deriv Bot Builder
            </div>
            <div style={{ fontSize: 11, color: '#4a5568' }}>
              Build and run automated trading strategies
            </div>
          </div>
        </div>
        
        <a
          href="https://dbot.deriv.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '6px 14px',
            background: 'rgba(0,230,118,0.1)',
            border: '1px solid rgba(0,230,118,0.2)',
            borderRadius: 8,
            color: '#00e676',
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Open Full Screen ↗
        </a>
      </div>

      {/* Deriv Bot iframe */}
      {!loaded ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 16,
          flexDirection: 'column'
        }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid #00e676',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}/>
          <p style={{ color: '#8892a4', fontSize: 13 }}>Loading Bot Builder...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <iframe
          id="dbot-frame"
          src="https://dbot.deriv.com"
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
            height: '100%',
          }}
          allow="clipboard-read; clipboard-write"
          title="Deriv Bot Builder"
        />
      )}
    </div>
  )
}
