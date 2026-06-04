import { contextBridge, ipcRenderer } from 'electron'

/**
 * Expose les APIs Electron au renderer via contextBridge.
 * Aucun accès direct à Node.js depuis le renderer — sécurité Electron (Property 10).
 *
 * window.electronAPI est disponible dans tout le renderer React.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Récupère le token stocké dans electron-store */
  getToken: (): Promise<string | null> =>
    ipcRenderer.invoke('store:get-token'),

  /** Stocke le token dans electron-store */
  setToken: (token: string): Promise<void> =>
    ipcRenderer.invoke('store:set-token', token),

  /** Supprime le token de electron-store */
  clearToken: (): Promise<void> =>
    ipcRenderer.invoke('store:clear-token'),
})
