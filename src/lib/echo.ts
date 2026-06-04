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
 */
function createEcho(token: string | null = null): Echo<'reverb'> {
  return new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY ?? 'local',
    wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: 'http://localhost:8080/broadcasting/auth',
    auth: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })
}

export { createEcho }
export type { Echo }
