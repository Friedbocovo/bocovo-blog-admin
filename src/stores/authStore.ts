import { create } from 'zustand'
import { setApiToken } from '../lib/api'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  initialized: boolean
  /** Charge le token depuis electron-store au démarrage */
  init: () => Promise<void>
  setToken: (token: string, user: User) => Promise<void>
  setUser: (user: User) => void
  logout: () => Promise<void>
}

/**
 * Store d'authentification admin.
 * Le token est stocké de façon persistante dans electron-store via window.electronAPI.
 * En développement web (sans Electron), on utilise sessionStorage comme fallback.
 */
const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  initialized: false,

  /** Initialisation au démarrage — lit le token depuis electron-store */
  init: async () => {
    let token: string | null = null
    try {
      token = await window.electronAPI.getToken()
    } catch {
      // Fallback : développement sans Electron
      token = sessionStorage.getItem('admin-token')
    }
    setApiToken(token)
    set({ token, initialized: true })
  },

  /** Stocke le token après login réussi */
  setToken: async (token: string, user: User) => {
    try {
      await window.electronAPI.setToken(token)
    } catch {
      sessionStorage.setItem('admin-token', token)
    }
    setApiToken(token)
    set({ token, user })
  },

  setUser: (user: User) => set({ user }),

  /** Logout — supprime le token partout */
  logout: async () => {
    try {
      await window.electronAPI.clearToken()
    } catch {
      sessionStorage.removeItem('admin-token')
    }
    setApiToken(null)
    set({ token: null, user: null })
  },
}))

export default useAuthStore
