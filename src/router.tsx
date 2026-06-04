import { createHashRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PostsPage from './pages/PostsPage'
import PostEditorPage from './pages/PostEditorPage'
import CommentsPage from './pages/CommentsPage'
import ChatPage from './pages/ChatPage'
import AboutAdminPage from './pages/AboutAdminPage'
import ProfileAdminPage from './pages/ProfileAdminPage'

/**
 * HashRouter utilisé pour Electron (compatibilité file://)
 */
const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/posts', element: <PostsPage /> },
      { path: '/posts/new', element: <PostEditorPage /> },
      { path: '/posts/:id/edit', element: <PostEditorPage /> },
      { path: '/comments', element: <CommentsPage /> },
      { path: '/chat', element: <ChatPage /> },
      { path: '/about', element: <AboutAdminPage /> },
      { path: '/profile', element: <ProfileAdminPage /> },
    ],
  },
])

export default router
