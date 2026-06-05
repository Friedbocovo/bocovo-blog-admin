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
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const echoRef = useRef<ReturnType<typeof createEcho> | null>(null)

  useEffect(() => {
    api.get<Conversation[]>('/conversations')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : []
        setConversations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
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
    if (!input.trim() || !activeUser || sending) return
    setSending(true)
    try {
      const r = await api.post<Message>('/messages', { 
        receiver_id: activeUser.id, 
        content: input.trim() 
      })
      setMessages(prev => [...prev, r.data])
      setInput('')
    } catch { 
      // Afficher une erreur si nécessaire
    } finally { 
      setSending(false) 
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Messages
        </h1>
        <div className="animate-pulse h-96 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }} />
      </div>
    )
  }

  return (
    <div className="w-full">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
        Messages
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Liste des conversations */}
        <div className="lg:col-span-1 rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Conversations ({conversations.length})
            </h2>
          </div>
          
          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  Aucune conversation pour le moment
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ color: 'var(--border)' }}>
                {conversations.map(conv => (
                  <button 
                    key={conv.user.id} 
                    onClick={() => openConversation(conv.user)}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-opacity-80 transition-all ${
                      activeUser?.id === conv.user.id ? 'ring-2 ring-opacity-50' : ''
                    }`}
                    style={{ 
                      backgroundColor: activeUser?.id === conv.user.id ? 'var(--bg-tertiary)' : 'transparent',
                      ...(activeUser?.id === conv.user.id && { 
                        '--tw-ring-color': 'var(--accent)' 
                      } as React.CSSProperties)
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar src={conv.user.avatar} name={conv.user.name} size="md" />
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--danger)', color: 'white' }}>
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {conv.user.name}
                        </h3>
                        <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                          {new Date(conv.last_message.created_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {conv.last_message.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone de conversation */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          {activeUser ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <Avatar src={activeUser.avatar} name={activeUser.name} size="md" />
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {activeUser.name}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {activeUser.email}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Commencez la conversation...
                    </p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isSent = m.sender_id === user?.id
                    return (
                      <div key={m.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm px-4 py-2.5 rounded-2xl ${
                          isSent ? 'rounded-br-md' : 'rounded-bl-md'
                        }`} style={{
                          backgroundColor: isSent ? 'var(--accent)' : 'var(--bg-secondary)',
                          color: isSent ? 'var(--bg-primary)' : 'var(--text-primary)',
                          border: isSent ? 'none' : '1px solid var(--border)'
                        }}>
                          <p className="text-sm break-words">{m.content}</p>
                          <div className={`flex items-center gap-2 mt-1 text-xs opacity-70 ${
                            isSent ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>
                              {new Date(m.created_at).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {isSent && (
                              <span>{m.read_at ? '✓✓' : '✓'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border)' 
                  }}
                  disabled={sending}
                />
                <button 
                  type="submit" 
                  disabled={sending || !input.trim()}
                  className="px-6 py-3 rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center min-w-[80px]"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: 'var(--bg-primary)' 
                  }}
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Envoyer'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Sélectionnez une conversation
              </h3>
              <p className="text-sm text-center max-w-sm" style={{ color: 'var(--text-muted)' }}>
                Choisissez une conversation dans la liste pour commencer à discuter avec vos visiteurs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
