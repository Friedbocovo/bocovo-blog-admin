import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen, title, message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = true,
  onConfirm, onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }} onClick={onCancel} />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: '14px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: danger ? 'rgba(224,82,82,0.15)' : 'rgba(26,155,196,0.15)' }}>
              <AlertTriangle size={16} style={{ color: danger ? 'var(--c-red)' : 'var(--c-cyan)' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)' }}>{title}</span>
          </div>
          <button onClick={onCancel} style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--c-muted)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--c-sub)', lineHeight: 1.6 }}>{message}</p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--c-border)' }}>
          <button onClick={onCancel}
            style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, background: 'var(--c-surface2)', color: 'var(--c-sub)', border: '1px solid var(--c-border)', cursor: 'pointer' }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, background: danger ? 'var(--c-red)' : 'var(--c-cyan-dim)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
