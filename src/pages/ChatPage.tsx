import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'
import { createEcho } from '../lib/echo'
import useAuthStore from '../stores/authStore'
import type { Conversation, Message, User } from '../types'
import Avatar from '../components/shared/Avatar'

export default function ChatPage() {
  const { token, user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const echoRef = useRef<ReturnType<typeof createEcho> | null>(null)

  useEffect(() => {
    api.get<Conversation[]>('/conversations')
      .then(r => setConversations(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!token || !user) return
    const echo = createEcho(token)
    echoRef.current = echo
    echo.private(`chat.${user.id}`).listen('NewMessage', (e: { message: Message }) => {
      setMessages(prev => [...prev, e.message])
      api.patch(`/messages/${e.message.id}/read`).catch(() => {})
      setConversations(prev => prev.map(c =>
        c.user.id === e.message.sender_id ? { ...c, last_message: e.message, unread_count: c.unread_count + 1 } : c
      ))
    })
    return () => { echo.leave(`chat.${user.id}`); echo.disconnect() }
  }, [token, user])

  const openConversation = async (convUser: User) => {
    setActiveUser(convUser)
    try {
      const r = await api.get<Message[]>(`/conversations/${convUser.id}`)
      setMessages(Array.isArray(r.data) ? r.data : [])
      const unread = (Array.isArray(r.data) ? r.data : []).filter(m => !m.read_at && m.sender_id === convUser.id)
      for (const m of unread) api.patch(`/messages/${m.id}/read`).catch(() => {})
      setConversations(prev => prev.map(c => c.user.id === convUser.id ? { ...c, unread_count: 0 } : c))
    } catch { }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeUser) return
    setSending(true)
    try {
      const r = await api.post<Message>('/messages', { receiver_id: activeUser.id, content: input.trim() })
      setMessages(prev => [...prev, r.data]); setInput('')
    } catch { } finally { setSending(false) }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Sidebar conversations */}
      <div className="w-72 flex-shrink-0 flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0
            ? <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Aucune conversation</p>
            : conversations.map(conv => (
              <button key={conv.user.id} onClick={() => openConversation(conv.user)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:opacity-80"
                style={{ backgroundColor: activeUser?.id === conv.user.id ? 'rgba(18,118,158,0.15)' : 'transparent', borderBottom: '1px solid var(--border)', borderLeft: activeUser?.id === conv.user.id ? '2px solid var(--accent-light)' : '2px solid transparent' }}>
                <Avatar src={conv.user.avatar} name={conv.user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{conv.user.name}</span>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', color: 'var(--cream)' }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{conv.last_message.content}</p>
                </div>
              </button>
            ))
          }
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {activeUser ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <Avatar src={activeUser.avatar} name={activeUser.name} size="sm" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activeUser.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{activeUser.email}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(m => {
                const isSent = m.sender_id === user?.id
                return (
                  <div key={m.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl"
                      style={{
                        background: isSent ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'var(--bg-secondary)',
                        color: isSent ? 'var(--cream)' : 'var(--text-primary)',
                        border: isSent ? 'none' : '1px solid var(--border)',
                        borderBottomRightRadius: isSent ? '4px' : undefined,
                        borderBottomLeftRadius: !isSent ? '4px' : undefined,
                      }}>
                      <p className="text-sm break-words">{m.content}</p>
                      <p className={`text-xs mt-1 opacity-60 ${isSent ? 'text-right' : ''}`}>
                        {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {isSent && m.read_at && ' ✓✓'}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 p-4" style={{ borderTop: '1px solid var(--border)' }}>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Votre message…"
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
              <button type="submit" disabled={sending || !input.trim()}
                className="px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', color: 'var(--cream)' }}>
                {sending ? '…' : '→'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: 'rgba(18,118,158,0.1)', border: '1px solid var(--border)' }}>
              ✉️
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
