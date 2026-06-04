import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  trend?: string
  onClick?: () => void
}

export default function StatCard({ label, value, icon, trend, onClick }: StatCardProps) {
  return (
    <div onClick={onClick}
      style={{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px',
        padding: 'clamp(1rem, 2vw, 1.25rem)', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s',
        display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '140px'
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-cyan-dim)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', minHeight: '44px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,155,196,0.1)', color: 'var(--c-cyan)' }}>
          {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {trend && <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(29,184,122,0.15)', color: 'var(--c-green)', whiteSpace: 'nowrap' }}>{trend}</span>}
          {onClick && <span style={{ fontSize: '0.72rem', color: 'var(--c-cyan)', whiteSpace: 'nowrap' }}>Voir →</span>}
        </div>
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1, wordBreak: 'break-word' }}>
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
        <p style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', color: 'var(--c-muted)', marginTop: '0.25rem' }}>{label}</p>
      </div>
    </div>
  )
}
