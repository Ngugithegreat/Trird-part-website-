'use client';
/**
 * @fileOverview A reusable placeholder component for features that are still in development.
 */

export default function ComingSoonPage({ 
  icon, title, description 
}: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: '#06080f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{
          width: 80, height: 80,
          borderRadius: 20,
          background: 'rgba(0,230,118,0.08)',
          border: '1px solid rgba(0,230,118,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
          margin: '0 auto 24px',
        }}>{icon}</div>
        <h1 style={{ 
          fontSize: 28, fontWeight: 700, 
          color: '#e8eaf0', marginBottom: 12,
          letterSpacing: '-0.02em'
        }}>{title}</h1>
        <p style={{ 
          fontSize: 15, color: '#8892a4', 
          lineHeight: 1.7, marginBottom: 32 
        }}>{description}</p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,230,118,0.08)',
          border: '1px solid rgba(0,230,118,0.15)',
          borderRadius: 20, padding: '8px 20px',
          fontSize: 12, color: '#00e676', fontWeight: 500
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#00e676',
            animation: 'pulse 2s infinite',
            display: 'inline-block'
          }}/>
          Feature in development
        </div>
        <div style={{ marginTop: 32 }}>
          <a href="/dashboard/trade" style={{
            display: 'inline-block',
            padding: '12px 28px',
            background: 'linear-gradient(135deg,#00e676,#00b0ff)',
            color: '#000', borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            textDecoration: 'none'
          }}>
            Go to Manual Trader →
          </a>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}
