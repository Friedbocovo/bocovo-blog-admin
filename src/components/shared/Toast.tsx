import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export interface ToastData {
  id: string
  type: 'success' | 'error'
  message: string
}

interface ToastProps {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 3500)
    return () => clearTimeout(t)
  }, [toast.id, onRemove])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      padding: '0.75rem 1rem', borderRadius: '10px', minWidth: '260px', maxWidth: '380px',
      background: toast.type === 'success' ? 'rgba(29,184,122,0.15)' : 'rgba(224,82,82,0.15)',
      border: `1px solid ${toast.type === 'success' ? 'rgba(29,184,122,0.35)' : 'rgba(224,82,82,0.35)'}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
      animation: 'slideIn 0.25s ease',
    }}>
      {toast.type === 'success'
        ? <CheckCircle size={16} style={{ color: 'var(--c-green)', flexShrink: 0 }} />
        : <XCircle size={16} style={{ color: 'var(--c-red)', flexShrink: 0 }} />
      }
      <p style={{ fontSize: '0.875rem', color: 'var(--c-text)', flex: 1 }}>{toast.message}</p>
      <button onClick={() => onRemove(toast.id)}
        style={{ width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer', flexShrink: 0 }}>
        <X size={12} />
      </button>
    </div>
  )
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  )
}
