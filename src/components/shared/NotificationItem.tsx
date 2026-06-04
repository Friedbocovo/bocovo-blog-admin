import { Heart, MessageSquare, Mail, AtSign, Bell } from 'lucide-react'
import type { Notification } from '../../types'

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
}

function getIcon(type: string) {
  const s = { size: 14, strokeWidth: 1.75 }
  switch (type) {
    case 'like': return <Heart {...s} />
    case 'comment': return <MessageSquare {...s} />
    case 'message': return <Mail {...s} />
    case 'mention': return <AtSign {...s} />
    default: return <Bell {...s} />
  }
}

export default function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const isUnread = !notification.read_at
  return (
    <div
      onClick={() => isUnread && onMarkRead(notification.id)}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', cursor: isUnread ? 'pointer' : 'default', borderBottom: '1px solid var(--c-border)', background: isUnread ? 'rgba(26,155,196,0.05)' : 'transparent', transition: 'background 0.15s' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-cyan)', marginTop: '1px' }}>
        {getIcon(notification.data.type)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.825rem', color: 'var(--c-text)', lineHeight: 1.45, marginBottom: '0.2rem' }}>{notification.data.message}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)' }}>
          {new Date(notification.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUnread && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-cyan)', flexShrink: 0, marginTop: '6px' }} />}
    </div>
  )
}
