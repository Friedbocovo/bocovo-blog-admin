import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../stores/authStore'
import type { User } from '../types'

interface LoginResponse { token: string; user: User }

export default function LoginPage() {
  const navigate = useNavigate()
  const { setToken } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password })
      if (res.data.user.role !== 'admin') {
        setError('Accès réservé à l\'administrateur.')
        return
      }
      await setToken(res.data.token, res.data.user)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const s = (err as { response?: { status: number } }).response?.status
      setError(s === 401 ? 'Email ou mot de passe incorrect.' : 'Une erreur est survenue.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Fond dégradé style de la référence — rose/violet/bleu
      background: 'linear-gradient(135deg, #C5748A 0%, #8B6EA6 35%, #4A6FA5 65%, #2D5A8E 100%)',
      padding: '1.5rem',
    }}>
      {/* Wrapper card + bouton LOGIN en dessous */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '380px' }}>

        {/* Card principale avec effet glassmorphism */}
        <div style={{
          width: '100%',
          background: 'rgba(220, 210, 235, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          padding: '2.5rem 2rem 2rem',
          position: 'relative',
          paddingTop: '4rem', // espace pour l'avatar qui dépasse
        }}>
          {/* Avatar flottant centré au-dessus de la card */}
          <div style={{
            position: 'absolute',
            top: '-36px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #1A2A4A, #0D1B33)',
            border: '3px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}>
            {/* Icône utilisateur SVG */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          {/* Titre */}
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: '1.1rem', fontWeight: 700, color: 'rgba(20,30,60,0.85)', marginBottom: '1.75rem', letterSpacing: '0.02em' }}>
            Bocovo Blog Admin
          </p>

          {/* Champ Email */}
          <div style={{ marginBottom: '0.875rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(45, 70, 110, 0.55)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              {/* Icône */}
              <div style={{ padding: '0 0.75rem', display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email ID"
                required
                autoComplete="email"
                style={{
                  flex: 1,
                  padding: '0.7rem 0.875rem',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>

          {/* Champ Password */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(45, 70, 110, 0.55)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ padding: '0 0.75rem', display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                style={{
                  flex: 1,
                  padding: '0.7rem 0.875rem',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              background: 'rgba(224,82,82,0.2)',
              color: '#ffaaaa',
              border: '1px solid rgba(224,82,82,0.3)',
              marginBottom: '0.75rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Bouton LOGIN — légèrement séparé en dessous, comme dans la référence */}
        <button
          onClick={handleSubmit as unknown as React.MouseEventHandler}
          disabled={loading}
          style={{
            width: '80%',
            padding: '0.85rem',
            marginTop: '-1px',
            background: 'rgba(200, 185, 220, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            color: 'rgba(20,30,60,0.85)',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          }}
        >
          {loading ? '…' : 'LOGIN'}
        </button>
      </div>

      {/* Placeholder input fix */}
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.45); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px rgba(45,70,110,0.8) inset !important; -webkit-text-fill-color: rgba(255,255,255,0.9) !important; }
      `}</style>
    </div>
  )
}
