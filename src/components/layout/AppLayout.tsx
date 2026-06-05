import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--c-bg)' }}>

      {/* ── SIDEBAR desktop : toujours visible ≥ 768px ── */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          onToggleNotifications={() => setShowNotifications(v => !v)}
          onNavigate={() => {}}
        />
      </div>

      {/* ── SIDEBAR mobile : drawer ── */}
      {sidebarOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 50 }}>
            <Sidebar
              onToggleNotifications={() => { setShowNotifications(v => !v); setSidebarOpen(false) }}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* ── CONTENU PRINCIPAL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header mobile */}
        <div
          className="md:hidden"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1rem', height: '56px', flexShrink: 0,
            backgroundColor: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: 'var(--c-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', margin: 0 }}>Admin</h1>
          <div style={{ width: '40px' }} />
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <main style={{ padding: '1.5rem 2rem', minHeight: '100%' }}>
            <Outlet />
          </main>
        </div>
      </div>

      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  )
}
