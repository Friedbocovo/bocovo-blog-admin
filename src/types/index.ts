export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'visitor'
  avatar: string | null
  bio: string | null
  website: string | null
  social_links: Record<string, string> | null
}

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface Post {
  id: number
  user_id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  cover_image: string | null
  status: 'published' | 'draft'
  pinned: boolean
  views_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  user?: User
  tags?: Tag[]
  likes_count?: number
  favorites_count?: number
  comments_count?: number
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  parent_id: number | null
  content: string
  created_at: string
  updated_at: string
  user?: User
  post?: Post
  replies?: Comment[]
}

export interface Message {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  read_at: string | null
  created_at: string
  updated_at: string
  sender?: User
  receiver?: User
}

export interface Conversation {
  user: User
  last_message: Message
  unread_count: number
}

export interface Notification {
  id: string
  type: string
  notifiable_type: string
  notifiable_id: number
  data: {
    type: 'like' | 'comment' | 'message' | 'mention' | string
    message: string
    post_id?: number
    post_slug?: string
    comment_id?: number
    sender_id?: number
    sender_name?: string
  }
  read_at: string | null
  created_at: string
}

export interface Stats {
  total_posts: number
  published_posts: number
  draft_posts: number
  total_views: number
  total_likes: number
  total_comments: number
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// Type global pour window.electronAPI (contextBridge)
export interface ElectronAPI {
  getToken: () => Promise<string | null>
  setToken: (token: string) => Promise<void>
  clearToken: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
