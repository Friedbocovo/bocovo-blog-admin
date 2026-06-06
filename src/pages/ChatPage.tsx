import { useEffect, useState, useRef } from 'react'
import { Send, Search, ArrowLeft, MoreVertical } from 'lucide-react'
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
        <div style={{ textAlign: 'center' }}>
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
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--c-bg)' 
      }}>
        {!activeUser ? (
          // Liste des conversations (mobile) - Design moderne
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header mobile moderne - FIXE */}
            <div style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'var(--c-surface)', 
              borderBottom: '1px solid var(--c-border)', 
              padding: '1rem' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '1rem' 
              }}>
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  fontFamily: 'var(--font-head)', 
                  fontWeight: 'bold', 
                  color: 'var(--c-text)' 
                }}>
                  Messages
                </h1>
               
              </div>
              
              {/* Barre de recherche moderne */}
              <div style={{ position: 'relative' }}>
                <Search style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--c-muted)' 
                }} size={18} />
                <input
                  type="text"
                  placeholder="Search for messages or users"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '3rem',
                    paddingRight: '1rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    background: 'var(--c-bg)',
                    border: '1px solid var(--c-border)',
                    borderRadius: '12px',
                    color: 'var(--c-text)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
            
            {/* Liste des conversations - Style moderne */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              paddingTop: '140px', // Espace pour le header fixe
              paddingBottom: '1rem'
            }}>
              {filteredConversations.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '4rem 1rem', 
                  textAlign: 'center' 
                }}>
                  <div style={{
                    width: '5rem',
                    height: '5rem',
                    background: 'var(--c-surface2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ fontSize: '2rem' }}>💬</span>
                  </div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: 'var(--c-text)', 
                    marginBottom: '0.5rem' 
                  }}>
                    No messages yet
                  </h3>
                  <p style={{ color: 'var(--c-sub)' }}>
                    New conversations will appear here
                  </p>
                </div>
              ) : (
                <div>
                  {filteredConversations.map(conv => (
                    <div 
                      key={conv.user.id} 
                      onClick={() => openConversation(conv.user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        borderBottom: '1px solid var(--c-border)'
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-surface2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      <div style={{ position: 'relative' }}>
                        <Avatar src={conv.user.avatar} name={conv.user.name} size="lg" />
                        {/* Indicateur en ligne */}
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '12px',
                          height: '12px',
                          background: 'var(--c-green)',
                          borderRadius: '50%',
                          border: '2px solid var(--c-bg)'
                        }} />
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          marginBottom: '0.25rem' 
                        }}>
                          <h3 style={{ 
                            fontWeight: '600', 
                            color: 'var(--c-text)', 
                            fontSize: '0.95rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '12rem'
                          }}>
                            {conv.user.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--c-muted)' 
                            }}>
                              {formatTime(conv.last_message.created_at)}
                            </span>
                            {conv.unread_count > 0 && (
                              <div style={{
                                minWidth: '20px',
                                height: '20px',
                                background: 'var(--c-cyan)',
                                color: 'var(--c-cream)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>
                                {conv.unread_count > 9 ? '9+' : conv.unread_count}
                              </div>
                            )}
                          </div>
                        </div>
                        <p style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--c-sub)', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conv.last_message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Vue conversation (mobile) - Design moderne
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header conversation moderne - FIXE */}
            <div style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'var(--c-surface)', 
              borderBottom: '1px solid var(--c-border)', 
              padding: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem' 
            }}>
              <button 
                onClick={() => setActiveUser(null)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--c-bg)',
                  border: '1px solid var(--c-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={18} style={{ color: 'var(--c-text)' }} />
              </button>
              
              <div style={{ position: 'relative' }}>
                <Avatar src={activeUser.avatar} name={activeUser.name} size="md" />
                <div style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '10px',
                  height: '10px',
                  background: 'var(--c-green)',
                  borderRadius: '50%',
                  border: '2px solid var(--c-surface)'
                }} />
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: 'var(--c-text)', 
                  fontSize: '1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activeUser.name}
                </h3>
                <p style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--c-green)' 
                }}>
                  Active now
                </p>
              </div>
              
              <button style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--c-bg)',
                border: '1px solid var(--c-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <MoreVertical size={18} style={{ color: 'var(--c-text)' }} />
              </button>
            </div>

            {/* Messages - Design moderne */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '10px',
              paddingTop: '30px', // Espace pour le header fixe 
              paddingBottom: '80px', // Espace pour l'input fixe
              background: 'var(--c-bg)' 
            }}>
              {messages.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '4rem',
                      height: '4rem',
                      background: 'var(--c-surface2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      margin: '0 auto 1rem'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>👋</span>
                    </div>
                    <p style={{ color: 'var(--c-sub)' }}>
                      Start conversation with {activeUser.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {messages.map(m => {
                    const isSent = m.sender_id === user?.id
                    return (
                      <div key={m.id} style={{ 
                        display: 'flex', 
                        justifyContent: isSent ? 'flex-end' : 'flex-start' 
                      }}>
                        <div style={{
                          maxWidth: '75%',
                          padding: '0.75rem 1rem',
                          borderRadius: '18px',
                          background: isSent ? 'var(--c-cyan)' : 'var(--c-surface2)',
                          color: isSent ? 'var(--c-cream)' : 'var(--c-text)',
                          position: 'relative'
                        }}>
                          <p style={{ 
                            fontSize: '0.9rem', 
                            lineHeight: 1.4,
                            wordBreak: 'break-word'
                          }}>
                            {m.content}
                          </p>
                          <div style={{
                            fontSize: '0.7rem',
                            color: isSent ? 'rgba(255,255,255,0.7)' : 'var(--c-muted)',
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isSent ? 'flex-end' : 'flex-start',
                            gap: '0.25rem'
                          }}>
                            <span>{formatTime(m.created_at)}</span>
                            {isSent && (
                              <span style={{ color: m.read_at ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)' }}>
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
            
            {/* Input mobile moderne - FIXE */}
            <div style={{ 
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'var(--c-surface)', 
              borderTop: '1px solid var(--c-border)', 
              padding: '1rem' 
            }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{
                  flex: 1,
                  background: 'var(--c-bg)',
                  borderRadius: '20px',
                  border: '1px solid var(--c-border)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem'
                }}>
                  <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    placeholder="Message..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--c-text)',
                      fontSize: '0.9rem'
                    }}
                    disabled={sending}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sending || !input.trim()}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: input.trim() ? 'var(--c-cyan)' : 'var(--c-surface2)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {sending ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%'
                    }} className="animate-spin" />
                  ) : (
                    <Send 
                      size={18} 
                      style={{ 
                        color: input.trim() ? 'var(--c-cream)' : 'var(--c-muted)' 
                      }} 
                    />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }
  // Layout desktop - Design moderne comme Discord/Slack
  return (
    <div style={{ 
      height: '90vh', 
      display: 'flex', 
      background: 'var(--c-bg)' 
    }}>
      {/* Sidebar conversations - Style moderne */}
      <div style={{ 
        width: '420px', 
        borderRight: '1px solid var(--c-border)', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--c-surface)' 
      }}>
        {/* Header sidebar */}
        <div style={{ 
          padding: '1rem', 
          borderBottom: '1px solid var(--c-border)' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1rem' 
          }}>
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontFamily: 'var(--font-head)', 
              fontWeight: 'bold', 
              color: 'var(--c-text)' 
            }}>
              Messages ({filteredConversations.length})
            </h1>
            
          </div>
          
          {/* Barre de recherche */}
          <div style={{ position: 'relative' }}>
            <Search style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--c-muted)' 
            }} size={16} />
            <input
              type="text"
              placeholder="Search Message"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '0.75rem',
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
                background: 'var(--c-bg)',
                border: '1px solid var(--c-border)',
                borderRadius: '8px',
                color: 'var(--c-text)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
        
        {/* Liste des conversations */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '3rem 1rem', 
              textAlign: 'center' 
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'var(--c-surface2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>💬</span>
              </div>
              <p style={{ color: 'var(--c-sub)', fontSize: '0.875rem' }}>
                {searchQuery ? 'No results found' : 'No conversations'}
              </p>
            </div>
          ) : (
            <div>
              {filteredConversations.map(conv => (
                <div 
                  key={conv.user.id} 
                  onClick={() => openConversation(conv.user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: activeUser?.id === conv.user.id ? 'var(--c-surface2)' : 'transparent',
                    borderLeft: `3px solid ${activeUser?.id === conv.user.id ? 'var(--c-cyan)' : 'transparent'}`
                  }}
                  onMouseEnter={e => {
                    if (activeUser?.id !== conv.user.id) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-bg)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeUser?.id !== conv.user.id) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Avatar src={conv.user.avatar} name={conv.user.name} size="md" />
                    {/* Indicateur en ligne */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0px',
                      right: '0px',
                      width: '10px',
                      height: '10px',
                      background: 'var(--c-green)',
                      borderRadius: '50%',
                      border: '2px solid var(--c-surface)'
                    }} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginBottom: '0.25rem' 
                    }}>
                      <h3 style={{ 
                        fontWeight: '600', 
                        color: 'var(--c-text)', 
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.user.name}
                      </h3>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--c-muted)',
                        flexShrink: 0,
                        marginLeft: '0.5rem'
                      }}>
                        {formatTime(conv.last_message.created_at)}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between' 
                    }}>
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--c-sub)', 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {conv.last_message.content}
                      </p>
                      {conv.unread_count > 0 && (
                        <div style={{
                          minWidth: '18px',
                          height: '18px',
                          background: 'var(--c-cyan)',
                          color: 'var(--c-cream)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          marginLeft: '0.5rem'
                        }}>
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Zone de conversation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeUser ? (
          <>
            {/* Header conversation */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '1rem 1.5rem', 
              borderBottom: '1px solid var(--c-border)', 
              background: 'var(--c-surface)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar src={activeUser.avatar} name={activeUser.name} size="md" />
                  <div style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    width: '10px',
                    height: '10px',
                    background: 'var(--c-green)',
                    borderRadius: '50%',
                    border: '2px solid var(--c-surface)'
                  }} />
                </div>
                <div>
                  <h3 style={{ 
                    fontWeight: '600', 
                    color: 'var(--c-text)', 
                    fontSize: '1rem' 
                  }}>
                    {activeUser.name}
                  </h3>
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--c-green)' 
                  }}>
                    Active now
                  </p>
                </div>
              </div>
              <button style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: 'var(--c-bg)',
                border: '1px solid var(--c-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <MoreVertical size={16} style={{ color: 'var(--c-text)' }} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '1.5rem', 
              background: 'var(--c-bg)' 
            }}>
              {messages.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '5rem',
                      height: '5rem',
                      background: 'var(--c-surface2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      margin: '0 auto 1rem'
                    }}>
                      <span style={{ fontSize: '2rem' }}>👋</span>
                    </div>
                    <h3 style={{ 
                      fontWeight: '600', 
                      color: 'var(--c-text)', 
                      marginBottom: '0.5rem' 
                    }}>
                      Start conversation
                    </h3>
                    <p style={{ color: 'var(--c-sub)' }}>
                      Send a message to {activeUser.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {messages.map(m => {
                    const isSent = m.sender_id === user?.id
                    return (
                      <div key={m.id} style={{ 
                        display: 'flex', 
                        justifyContent: isSent ? 'flex-end' : 'flex-start' 
                      }}>
                        <div style={{
                          maxWidth: '60%',
                          padding: '0.875rem 1.125rem',
                          borderRadius: '16px',
                          background: isSent ? 'var(--c-cyan)' : 'var(--c-surface2)',
                          color: isSent ? 'var(--c-cream)' : 'var(--c-text)',
                          position: 'relative'
                        }}>
                          <p style={{ 
                            fontSize: '0.9rem', 
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                            margin: 0
                          }}>
                            {m.content}
                          </p>
                          <div style={{
                            fontSize: '0.7rem',
                            color: isSent ? 'rgba(255,255,255,0.7)' : 'var(--c-muted)',
                            marginTop: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isSent ? 'flex-end' : 'flex-start',
                            gap: '0.25rem'
                          }}>
                            <span>{formatTime(m.created_at)}</span>
                            {isSent && (
                              <span style={{ 
                                color: m.read_at ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)' 
                              }}>
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
            <div style={{ 
              padding: '1rem 1.5rem', 
              borderTop: '1px solid var(--c-border)', 
              background: 'var(--c-surface)' 
            }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{
                  flex: 1,
                  background: 'var(--c-bg)',
                  borderRadius: '20px',
                  border: '1px solid var(--c-border)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  minHeight: '44px'
                }}>
                  <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    placeholder="Your message here"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--c-text)',
                      fontSize: '0.9rem'
                    }}
                    disabled={sending}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sending || !input.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '20px',
                    background: input.trim() ? 'var(--c-cyan)' : 'var(--c-surface2)',
                    border: 'none',
                    color: input.trim() ? 'var(--c-cream)' : 'var(--c-muted)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {sending ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%'
                    }} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'var(--c-bg)' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '6rem',
                height: '6rem',
                background: 'var(--c-surface2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                margin: '0 auto 1.5rem'
              }}>
                <span style={{ fontSize: '2.5rem' }}>💬</span>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem',
                fontWeight: '600', 
                color: 'var(--c-text)', 
                marginBottom: '0.5rem' 
              }}>
                Select a conversation
              </h3>
              <p style={{ 
                color: 'var(--c-sub)', 
                maxWidth: '20rem' 
              }}>
                Choose a conversation from the list to start messaging with your visitors.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}