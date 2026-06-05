import { X, Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useNotificationStore from '../../stores/notificationStore'
import api from '../../lib/api'
import type { Notification } from '../../types'

interface Props { onClose: () => void }

function getIcon(type: string) {
  switch (type) {
    case 'like': return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    case 'comment': return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'message': return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    default: return <Bell size={14} />
  }
}

export default function NotificationPanel({ onClose }: Props) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()
  const navigate = useNavigate()

  const handleMarkRead = async (id: string) => {
    try { await api.patch(`/notifications/${id}/read`) } catch { }
    markRead(id)
  }

  const handleMarkAllRead = async () => {
    try { await api.patch('/notifications/read-all') } catch { }
    markAllRead()
  }

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lu si pas déjà lu
    if (!notification.read_at) {
      handleMarkRead(notification.id)
    }

    // Navigation en fonction du type de notification
    const { type, post_id } = notification.data

    switch (type) {
      case 'new_comment':
      case 'comment_reply':
        // Rediriger vers la page des commentaires
        navigate('/comments')
        break
      case 'new_message':
        // Rediriger vers la page des messages
        navigate('/chat')
        break
      case 'new_like':
        // Rediriger vers la page d'édition de l'article
        if (post_id) {
          navigate(`/posts/${post_id}/edit`)
        } else {
          navigate('/posts')
        }
        break
      default:
        // Pour les autres types, rediriger vers le dashboard
        navigate('/')
        break
    }

    // Fermer le panel après navigation
    onClose()
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={onClose} />
      <div style={{
        position: 'fixed', right: 0, top: 0, height: '100vh', width: '320px', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        background: 'var(--c-surface)', borderLeft: '1px solid var(--c-border)',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={16} style={{ color: 'var(--c-cyan)' }} />
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--c-text)' }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '99px', background: 'var(--c-red)', color: '#fff' }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--c-cyan)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <CheckCheck size={13} /> Tout lu
              </button>
            )}
            <button onClick={onClose}
              style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--c-muted)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', padding: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} style={{ color: 'var(--c-muted)' }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', textAlign: 'center' }}>Aucune notification</p>
            </div>
          ) : (
            notifications.map((n: Notification) => (
              <div key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--c-border)',
                  cursor: 'pointer',
                  background: !n.read_at ? 'rgba(26,155,196,0.05)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = !n.read_at ? 'rgba(26,155,196,0.1)' : 'var(--c-surface2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = !n.read_at ? 'rgba(26,155,196,0.05)' : 'transparent'}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-cyan)', marginTop: '1px' }}>
                  {getIcon(n.data.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--c-text)', lineHeight: 1.45, marginBottom: '0.2rem' }}>{n.data.message}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)' }}>
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.read_at && (
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-cyan)', flexShrink: 0, marginTop: '6px' }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
