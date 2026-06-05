import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, MessageSquare, Mail, User, Settings, Bell, LogOut } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import useNotificationStore from '../../stores/notificationStore'
import api from '../../lib/api'

const navItems = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { to: '/posts', label: 'Articles', Icon: FileText, exact: false },
  { to: '/comments', label: 'Commentaires', Icon: MessageSquare, exact: false },
  { to: '/chat', label: 'Messages', Icon: Mail, exact: false },
  { to: '/about', label: 'À propos', Icon: User, exact: false },
  { to: '/profile', label: 'Profil', Icon: Settings, exact: false },
]

interface SidebarProps {
  onToggleNotifications: () => void
  onNavigate?: () => void
}

export default function Sidebar({ onToggleNotifications, onNavigate }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { }
    await logout()
  }

  const handleNavClick = () => {
    if (onNavigate) onNavigate()
  }

  return (
    <aside style={{
      width: '220px', minWidth: '220px', height: '100vh',
      display: 'flex', flexDirection: 'column',
      backgroundColor: 'var(--c-surface)', borderRight: '1px solid var(--c-border)',
      position: 'sticky', top: 0, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.1rem 1rem', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <img src="/favicon.png" alt="Blog Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0, objectFit: 'cover' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', whiteSpace: 'nowrap' }}>Admin</span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.625rem 0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navItems.map(({ to, label, Icon, exact }) => (
          <NavLink key={to} to={to} end={exact}
            onClick={handleNavClick}
            style={({ isActive }: { isActive: boolean }) => ({
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.55rem 0.75rem', borderRadius: '8px',
              fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--c-cyan)' : 'var(--c-sub)',
              backgroundColor: isActive ? 'rgba(26,155,196,0.1)' : 'transparent',
              borderLeft: `2px solid ${isActive ? 'var(--c-cyan)' : 'transparent'}`,
              textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap',
              minHeight: '44px',
            })}>
            <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.625rem 0.5rem', borderTop: '1px solid var(--c-border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Notifications */}
        <button onClick={onToggleNotifications}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--c-sub)', backgroundColor: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', position: 'relative', minHeight: '44px' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Bell size={16} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '14px', height: '14px', borderRadius: '50%', fontSize: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--c-red)', color: '#fff' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '99px', backgroundColor: 'var(--c-red)', color: '#fff' }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* User */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', minHeight: '44px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #12769E, #1A9BC4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
              {user.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>Admin</p>
            </div>
            <button onClick={handleLogout} title="Se déconnecter"
              style={{ width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,82,82,0.1)', color: 'var(--c-red)', cursor: 'pointer', minHeight: '44px', minWidth: '44px' }}>
              <LogOut size={13} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
