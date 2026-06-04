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

  // Close sidebar when clicking on a link
  const handleSidebarLinkClick = () => {
    setSidebarOpen(false)
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--c-bg)',
    }}>
      {/* Mobile Header - visible only on mobile (< 768px) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1rem',
        backgroundColor: 'var(--c-surface)',
        borderBottom: '1px solid var(--c-border)',
        height: '56px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
      }} className="md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: 'var(--c-text)',
            cursor: 'pointer',
            border: 'none',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          title={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--c-text)',
          margin: 0,
        }}>Admin</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Sidebar - hidden on mobile unless sidebarOpen, visible on tablet+ */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 50,
          transition: 'transform 0.3s ease-in-out',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="md:relative md:translate-x-0"
      >
        <Sidebar
          onToggleNotifications={() => setShowNotifications(v => !v)}
          onNavigate={handleSidebarLinkClick}
        />
      </div>

      {/* Mobile Sidebar Overlay - closes when clicking outside */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
          className="md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minWidth: 0,
        paddingTop: '56px',
      }} className="md:!pt-0">
        <main className="px-4 py-3 md:px-6 md:py-4 lg:px-8 lg:py-6" style={{
          minHeight: '100%',
        }}>
          <Outlet />
        </main>
      </div>

      {/* Panel notifications */}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  )
}
