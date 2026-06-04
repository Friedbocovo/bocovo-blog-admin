import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

/**
 * Crée une instance Laravel Echo connectée à Reverb.
 * Utilise les variables d'environnement pour la configuration :
 * - VITE_REVERB_APP_KEY : Clé d'application Reverb
 * - VITE_REVERB_HOST : Hôte du serveur WebSocket
 * - VITE_REVERB_PORT : Port du serveur WebSocket
 * - VITE_REVERB_SCHEME : Schéma (http ou https)
 * - VITE_API_URL : URL de base de l'API (pour l'authEndpoint)
 */
function createEcho(token: string | null = null): Echo<'reverb'> {
  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http'
  const host = import.meta.env.VITE_REVERB_HOST ?? 'localhost'
  const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080)
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
  
  // Construire l'URL de base de l'API (en supprimant '/api')
  const apiBaseUrl = apiUrl.replace(/\/api\/?$/, '')
  
  return new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY ?? 'local',
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
    auth: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })
}

export { createEcho }
export type { Echo }
