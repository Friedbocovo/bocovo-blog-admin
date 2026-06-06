import { useEffect, useState, useRef } from 'react'
import { Send, Search, MoreVertical, ArrowLeft, Phone, Video } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const echoRef = useRef<ReturnType<typeof createEcho> | null>(null)

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const filteredConversations = conversations.filter(conv => 
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontFamily: 'var(--font-head)', 
            fontWeight: 'bold', 
            color: 'var(--c-text)', 
            marginBottom: '0.5rem' 
          }}>
            Messages
          </h1>
          <p style={{ color: 'var(--c-sub)' }}>Communiquez avec vos visiteurs</p>
        </div>
        <div style={{ 
          background: 'var(--c-surface)', 
          borderRadius: '16px', 
          border: '1px solid var(--c-border)', 
          padding: '3rem', 
          textAlign: 'center' 
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: `4px solid var(--c-cyan)20`,
            borderTop: '4px solid var(--c-cyan)',
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }} className="animate-spin" />
          <p style={{ color: 'var(--c-text)', fontWeight: '500' }}>Chargement des conversations...</p>
        </div>
      </div>
    )
  }
  // Layout mobile avec navigation
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden">
        {!activeUser ? (
          // Liste des conversations (mobile)
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-slate-200 px-4 py-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher une conversation..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune conversation</h3>
                  <p className="text-slate-500 text-center">Les nouvelles conversations apparaîtront ici</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredConversations.map(conv => (
                    <button 
                      key={conv.user.id} 
                      onClick={() => openConversation(conv.user)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar src={conv.user.avatar} name={conv.user.name} size="lg" />
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{conv.user.name}</h3>
                          <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                            {formatTime(conv.last_message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {conv.last_message.content}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Vue conversation (mobile)
          <div className="flex-1 flex flex-col">
            {/* Header conversation */}
            <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
              <button 
                onClick={() => setActiveUser(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <Avatar src={activeUser.avatar} name={activeUser.name} size="md" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{activeUser.name}</h3>
                <p className="text-sm text-slate-500">En ligne</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <Phone size={18} className="text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <Video size={18} className="text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <MoreVertical size={18} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl">👋</span>
                    </div>
                    <p className="text-slate-600">Commencez la conversation avec {activeUser.name}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(m => {
                    const isSent = m.sender_id === user?.id
                    return (
                      <div key={m.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[280px] px-4 py-2 rounded-2xl ${
                          isSent ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                        } shadow-sm`}>
                          <p className="text-sm break-words">{m.content}</p>
                          <div className={`flex items-center gap-2 mt-1 text-xs ${
                            isSent ? 'text-blue-100 justify-end' : 'text-slate-500 justify-start'
                          }`}>
                            <span>{formatTime(m.created_at)}</span>
                            {isSent && (
                              <span className="text-blue-200">
                                {m.read_at ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
            {/* Input mobile - Le footer disparaît sur mobile grâce à la classe hidden */}
            <div className="bg-white border-t border-slate-200 p-4 md:block hidden">
              <form onSubmit={handleSend} className="flex gap-3 items-end">
                <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder-slate-500 outline-none resize-none"
                    disabled={sending}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sending || !input.trim()}
                  className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>
            
            {/* Input mobile fixe - Affiché seulement sur mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-pb z-50">
              <form onSubmit={handleSend} className="flex gap-3 items-end">
                <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder-slate-500 outline-none resize-none"
                    disabled={sending}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sending || !input.trim()}
                  className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }
  // Layout desktop
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontFamily: 'var(--font-head)', 
          fontWeight: 'bold', 
          color: 'var(--c-text)', 
          marginBottom: '0.5rem' 
        }}>
          Messages
        </h1>
        <p style={{ color: 'var(--c-sub)' }}>Communiquez avec vos visiteurs</p>
      </div>
      
      <div style={{ 
        background: 'var(--c-surface)', 
        borderRadius: '16px', 
        border: '1px solid var(--c-border)', 
        overflow: 'hidden', 
        height: 'calc(100vh - 12rem)' 
      }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Sidebar conversations */}
          <div style={{ 
            width: '20rem', 
            borderRight: '1px solid var(--c-border)', 
            display: 'flex', 
            flexDirection: 'column', 
            background: 'var(--c-bg)' 
          }}>
            <div style={{ 
              padding: '1rem', 
              borderBottom: '1px solid var(--c-border)', 
              background: 'var(--c-surface)' 
            }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--c-muted)' 
                }} size={18} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.625rem',
                    paddingBottom: '0.625rem',
                    background: 'var(--c-bg)',
                    border: '1px solid var(--c-border)',
                    borderRadius: '12px',
                    color: 'var(--c-text)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p className="text-sm text-slate-600 text-center">
                    {searchQuery ? 'Aucun résultat trouvé' : 'Aucune conversation'}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredConversations.map(conv => (
                    <button 
                      key={conv.user.id} 
                      onClick={() => openConversation(conv.user)}
                      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-white transition-all border-l-4 ${
                        activeUser?.id === conv.user.id 
                          ? 'bg-white border-blue-500 shadow-sm' 
                          : 'border-transparent hover:border-blue-200'
                      }`}
                    >
                      <div className="relative">
                        <Avatar src={conv.user.avatar} name={conv.user.name} size="md" />
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-slate-900 truncate">{conv.user.name}</h3>
                          <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                            {formatTime(conv.last_message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
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
          <div className="flex-1 flex flex-col">
            {activeUser ? (
              <>
                {/* Header conversation */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <Avatar src={activeUser.avatar} name={activeUser.name} size="md" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{activeUser.name}</h3>
                      <p className="text-sm text-slate-500">{activeUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <Phone size={18} className="text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <Video size={18} className="text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <MoreVertical size={18} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl">👋</span>
                        </div>
                        <h3 className="font-medium text-slate-900 mb-1">Nouvelle conversation</h3>
                        <p className="text-slate-600">Commencez la discussion avec {activeUser.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map(m => {
                        const isSent = m.sender_id === user?.id
                        return (
                          <div key={m.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md px-4 py-3 rounded-2xl ${
                              isSent 
                                ? 'bg-blue-500 text-white rounded-br-md shadow-sm' 
                                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md shadow-sm'
                            }`}>
                              <p className="break-words leading-relaxed">{m.content}</p>
                              <div className={`flex items-center gap-2 mt-2 text-xs ${
                                isSent ? 'text-blue-100 justify-end' : 'text-slate-500 justify-start'
                              }`}>
                                <span>{formatTime(m.created_at)}</span>
                                {isSent && (
                                  <span className="text-blue-200">
                                    {m.read_at ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>
                {/* Input desktop */}
                <div className="p-4 border-t border-slate-200 bg-white">
                  <form onSubmit={handleSend} className="flex gap-4 items-end">
                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <input 
                        type="text" 
                        value={input} 
                        onChange={e => setInput(e.target.value)}
                        placeholder="Tapez votre message..."
                        className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder-slate-500 outline-none"
                        disabled={sending}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={sending || !input.trim()}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={16} />
                          Envoyer
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/50 to-white">
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Sélectionnez une conversation</h3>
                  <p className="text-slate-600 max-w-sm">
                    Choisissez une conversation dans la liste pour commencer à discuter avec vos visiteurs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}