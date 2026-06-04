import axios from 'axios'

/**
 * Client Axios pour l'app admin.
 * Lit le token depuis le store Zustand (qui le lit lui-même depuis electron-store).
 */
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * Intercepteur de requête — injecte le Bearer token.
 * Le token est géré par authStore qui le lit via window.electronAPI.getToken().
 * Pour l'intercepteur synchrone, on lit depuis la variable module exportée par authStore.
 */
api.interceptors.request.use(
  (config) => {
    // Import dynamique pour éviter la dépendance circulaire
    try {
      const raw = sessionStorage.getItem('admin-token')
      if (raw) {
        config.headers.Authorization = `Bearer ${raw}`
      }
    } catch {
      // sessionStorage non disponible (contexte Electron)
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Intercepteur de réponse — gère les 401 (token expiré).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Nettoyage du token sessionStorage
      try { sessionStorage.removeItem('admin-token') } catch { /* ignore */ }
      // L'authStore détectera le token null au prochain render
      window.dispatchEvent(new CustomEvent('admin:logout'))
    }
    return Promise.reject(error)
  },
)

/** Met à jour le token injecté par l'intercepteur */
export function setApiToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem('admin-token', token)
    } else {
      sessionStorage.removeItem('admin-token')
    }
  } catch { /* ignore */ }
}

export default api
