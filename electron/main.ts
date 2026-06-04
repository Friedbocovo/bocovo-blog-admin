import { app, BrowserWindow, ipcMain } from 'electron'
import Store from 'electron-store'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Persistance sécurisée du token via electron-store
const store = new Store<{ token: string | null }>({
  name: 'blog-admin-auth',
  defaults: { token: null },
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      // Sécurité Electron : isolation activée, accès Node.js désactivé
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0f',
  })

  // En développement : charger le serveur Vite
  // En production : charger le fichier HTML buildé
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC handlers — gestion du token via electron-store
ipcMain.handle('store:get-token', () => {
  return store.get('token', null)
})

ipcMain.handle('store:set-token', (_event, token: string) => {
  store.set('token', token)
})

ipcMain.handle('store:clear-token', () => {
  store.set('token', null)
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
