import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import NotificationPanel from './NotificationPanel'
import useAuthStore from '../../stores/authStore'
import useNotificationStore from '../../stores/notificationStore'
import { createEcho } from '../../lib/echo'
import api from '../../lib/api'
import type { Notification } from '../../types'

export default function AppLayout() {
  const { token, user } = useAuthStore()
  const { setNotifications, addNotification } = useNotificationStore()
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get<Notification[]>('/notifications')
      .then(r => {
        const d = Array.isArray(r.data) ? r.data : (r.data as { data: Notification[] }).data ?? []
        setNotifications(d)
      }).catch(() => {})
  }, [token, setNotifications])

  useEffect(() => {
    if (!token || !user) return
    const echo = createEcho(token)
    echo.private(`user.${user.id}`).listen('NewNotification', (e: { notification: Notification }) => addNotification(e.notification))
    return () => { echo.leave(`user.${user.id}`); echo.disconnect() }
  }, [token, user, addNotification])

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--c-bg)',
    }}>
      {/* Sidebar fixe à gauche */}
      <Sidebar onToggleNotifications={() => setShowNotifications(v => !v)} />

      {/* Zone principale scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minWidth: 0,
      }}>
        <main style={{ padding: '1.75rem', minHeight: '100%' }}>
          <Outlet />
        </main>
      </div>

      {/* Panel notifications */}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  )
}
