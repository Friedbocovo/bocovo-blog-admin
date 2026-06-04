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
        padding: '1.25rem', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-cyan-dim)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,155,196,0.1)', color: 'var(--c-cyan)' }}>
          {icon}
        </div>
        {trend && <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(29,184,122,0.15)', color: 'var(--c-green)' }}>{trend}</span>}
        {onClick && <span style={{ fontSize: '0.72rem', color: 'var(--c-cyan)' }}>Voir →</span>}
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '0.25rem' }}>{label}</p>
      </div>
    </div>
  )
}
