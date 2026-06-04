import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import api from './lib/api'
import router from './router'
import type { User } from './types'

/**
 * Composant interne qui gère la vérification du token au démarrage.
 * Suit le flux Electron défini dans le design :
 *  1. getToken() depuis electron-store
 *  2. Si token présent → GET /api/auth/me → Dashboard ou LoginPage
 *  3. Si token absent ou erreur → LoginPage
 */
function AuthGate() {
  const { init, token, initialized, setUser, logout } = useAuthStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      await init()
      setChecking(false)
    }
    bootstrap()
  }, [init])

  // Une fois le token chargé, vérifier sa validité via /api/auth/me
  useEffect(() => {
    if (!initialized) return
    if (!token) {
      router.navigate('/login', { replace: true })
      return
    }
    api.get<User>('/auth/me')
      .then(res => {
        setUser(res.data)
        router.navigate('/', { replace: true })
      })
      .catch(async () => {
        await logout()
        router.navigate('/login', { replace: true })
      })
  }, [initialized, token, setUser, logout])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Chargement…</span>
      </div>
    )
  }

  return null
}

export default function App() {
  return (
    <>
      <AuthGate />
      <RouterProvider router={router} />
    </>
  )
}
