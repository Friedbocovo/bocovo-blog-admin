import { useEffect, useState } from 'react'
import { MessageSquare, Reply, Trash2, Calendar, ExternalLink, Search, Filter } from 'lucide-react'
import api from '../lib/api'
import type { Comment } from '../types'
import Avatar from '../components/shared/Avatar'

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyForms, setReplyForms] = useState<Record<number, string | undefined>>({})
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'recent' | 'with_replies'>('all')
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.get<Comment[]>('/admin/comments')
      .then(r => setComments(Array.isArray(r.data) ? r.data : (r.data as { data: Comment[] }).data ?? []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [])

  const handleReply = async (commentId: number) => {
    const content = replyForms[commentId]?.trim()
    if (!content) return
    setSubmitting(commentId)
    try {
      const res = await api.post<Comment>(`/comments/${commentId}/reply`, { content })
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: [...(c.replies ?? []), res.data] } : c))
      setReplyForms(prev => ({ ...prev, [commentId]: undefined }))
      setExpandedComments(prev => new Set([...prev, commentId]))
    } catch { 
      // Afficher une erreur si nécessaire
    } finally { 
      setSubmitting(null) 
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.')) return
    
    try {
      await api.delete(`/comments/${commentId}`)
      const remove = (list: Comment[]): Comment[] =>
        list.filter(c => c.id !== commentId).map(c => ({ ...c, replies: remove(c.replies ?? []) }))
      setComments(prev => remove(prev))
    } catch {
      alert('Erreur lors de la suppression du commentaire')
    }
  }

  const toggleExpanded = (commentId: number) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const filteredComments = comments.filter(comment => {
    // Recherche par contenu ou nom d'utilisateur
    const matchesSearch = !searchQuery || 
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.post?.title.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtres par statut
    if (filterStatus === 'recent') {
      const isRecent = new Date().getTime() - new Date(comment.created_at).getTime() < 7 * 24 * 60 * 60 * 1000 // 7 jours
      return matchesSearch && isRecent
    } else if (filterStatus === 'with_replies') {
      return matchesSearch && comment.replies && comment.replies.length > 0
    }
    
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        return diffMins <= 1 ? 'À l\'instant' : `Il y a ${diffMins}min`
      }
      return `Il y a ${diffHours}h`
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: diffDays > 365 ? 'numeric' : undefined 
      })
    }
  }
  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontFamily: 'var(--font-head)', 
            fontWeight: 'bold', 
            color: 'var(--c-text)' 
          }}>
            Commentaires
          </h1>
          <p style={{ color: 'var(--c-sub)', marginTop: '0.25rem' }}>Gérez les commentaires de vos visiteurs</p>
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
          <p style={{ color: 'var(--c-text)', fontWeight: '500' }}>Chargement des commentaires...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontFamily: 'var(--font-head)', 
          fontWeight: 'bold', 
          color: 'var(--c-text)', 
          marginBottom: '0.5rem' 
        }}>
          Commentaires
        </h1>
        <p style={{ color: 'var(--c-sub)' }}>Gérez et répondez aux commentaires de vos visiteurs</p>
      </div>

      {/* Filtres et recherche */}
      <div style={{ 
        background: 'var(--c-surface)', 
        borderRadius: '12px', 
        border: '1px solid var(--c-border)', 
        padding: '1.5rem', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem' 
        }}>
          <div style={{ flex: 1 }}>
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
                placeholder="Rechercher par contenu, auteur ou article..."
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
                  borderRadius: '8px',
                  color: 'var(--c-text)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} style={{ color: 'var(--c-muted)' }} />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                style={{
                  padding: '0.625rem 0.75rem',
                  background: 'var(--c-bg)',
                  border: '1px solid var(--c-border)',
                  borderRadius: '8px',
                  color: 'var(--c-text)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">Tous les commentaires</option>
                <option value="recent">Récents (7 jours)</option>
                <option value="with_replies">Avec réponses</option>
              </select>
            </div>
            
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--c-sub)',
              background: 'var(--c-surface2)',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--c-border)'
            }}>
              {filteredComments.length} commentaire{filteredComments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des commentaires */}
      {filteredComments.length === 0 ? (
        <div style={{ 
          background: 'var(--c-surface)', 
          borderRadius: '16px', 
          border: '1px solid var(--c-border)', 
          padding: '4rem', 
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
            marginBottom: '1.5rem',
            margin: '0 auto 1.5rem'
          }}>
            <MessageSquare size={32} style={{ color: 'var(--c-muted)' }} />
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontFamily: 'var(--font-head)',
            fontWeight: '600',
            color: 'var(--c-text)',
            marginBottom: '0.5rem'
          }}>
            {searchQuery || filterStatus !== 'all' ? 'Aucun commentaire trouvé' : 'Aucun commentaire'}
          </h3>
          <p style={{
            color: 'var(--c-sub)',
            maxWidth: '21rem',
            margin: '0 auto'
          }}>
            {searchQuery || filterStatus !== 'all' 
              ? 'Essayez de modifier vos critères de recherche ou filtres.'
              : 'Les commentaires de vos visiteurs apparaîtront ici.'
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredComments.map(comment => (
            <div key={comment.id} style={{ 
              background: 'var(--c-surface)', 
              borderRadius: '12px', 
              border: '1px solid var(--c-border)', 
              overflow: 'hidden',
              transition: 'all 0.2s'
            }}>
              {/* En-tête du commentaire */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Avatar 
                      src={comment.user?.avatar} 
                      name={comment.user?.name ?? 'Utilisateur'} 
                      size="md" 
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ 
                          fontWeight: '600', 
                          color: 'var(--c-text)',
                          fontFamily: 'var(--font-head)'
                        }}>
                          {comment.user?.name ?? 'Utilisateur anonyme'}
                        </h3>
                        {comment.parent_id && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(26, 155, 196, 0.1)',
                            color: 'var(--c-cyan)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            border: '1px solid rgba(26, 155, 196, 0.2)'
                          }}>
                            Réponse
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--c-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} />
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                        {comment.post && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ExternalLink size={14} />
                            <span style={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap', 
                              maxWidth: '12.5rem' 
                            }}>
                              {comment.post.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setReplyForms(p => ({ 
                        ...p, 
                        [comment.id]: p[comment.id] !== undefined ? undefined : `@${comment.user?.name} ` 
                      }))}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(26, 155, 196, 0.1)',
                        color: 'var(--c-cyan)',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      title="Répondre"
                    >
                      <Reply size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(224, 82, 82, 0.1)',
                        color: 'var(--c-red)',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Contenu du commentaire */}
                <div style={{ 
                  background: 'var(--c-bg)', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  marginBottom: '1rem',
                  border: '1px solid var(--c-border)'
                }}>
                  <p style={{ color: 'var(--c-text)', lineHeight: 1.6, wordBreak: 'break-word' }}>
                    {comment.content}
                  </p>
                </div>
                {/* Formulaire de réponse - Style moderne */}
                {replyForms[comment.id] !== undefined && (
                  <div style={{ 
                    background: 'rgba(26, 155, 196, 0.05)', 
                    border: '1px solid rgba(26, 155, 196, 0.2)', 
                    borderRadius: '12px', 
                    padding: '1rem', 
                    marginBottom: '1rem' 
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: 'var(--c-cyan)' 
                      }}>
                        Répondre à {comment.user?.name}
                      </label>
                      <textarea 
                        value={replyForms[comment.id]}
                        onChange={e => setReplyForms(p => ({ ...p, [comment.id]: e.target.value }))}
                        placeholder="Tapez votre réponse... (@mention supportée)"
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'var(--c-bg)',
                          border: '1px solid var(--c-border)',
                          borderRadius: '8px',
                          color: 'var(--c-text)',
                          fontSize: '0.875rem',
                          resize: 'none',
                          fontFamily: 'inherit'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setReplyForms(p => ({ ...p, [comment.id]: undefined }))}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--c-sub)',
                            background: 'transparent',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--c-text)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--c-sub)'}
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={() => handleReply(comment.id)} 
                          disabled={submitting === comment.id || !replyForms[comment.id]?.trim()}
                          style={{
                            padding: '0.5rem 1rem',
                            background: (submitting === comment.id || !replyForms[comment.id]?.trim()) ? 'var(--c-surface2)' : 'var(--c-cyan)',
                            color: (submitting === comment.id || !replyForms[comment.id]?.trim()) ? 'var(--c-muted)' : 'var(--c-cream)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: (submitting === comment.id || !replyForms[comment.id]?.trim()) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {submitting === comment.id ? (
                            <>
                              <div style={{
                                width: '1rem',
                                height: '1rem',
                                border: '2px solid currentColor',
                                borderTop: '2px solid transparent',
                                borderRadius: '50%'
                              }} className="animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            <>
                              <Reply size={14} />
                              Répondre
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Réponses - Style moderne */}
                {comment.replies && comment.replies.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleExpanded(comment.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--c-cyan)',
                        marginBottom: '0.75rem',
                        transition: 'color 0.2s',
                        background: 'transparent'
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--c-cyan-dim)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--c-cyan)'}
                    >
                      <div style={{
                        transition: 'transform 0.2s',
                        transform: expandedComments.has(comment.id) ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}>
                        ▶
                      </div>
                      {comment.replies.length} réponse{comment.replies.length > 1 ? 's' : ''}
                    </button>
                    
                    {expandedComments.has(comment.id) && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.75rem', 
                        paddingLeft: '1.5rem', 
                        borderLeft: '2px solid var(--c-border)' 
                      }}>
                        {comment.replies.map(reply => (
                          <div key={reply.id} style={{ 
                            background: 'var(--c-bg)', 
                            border: '1px solid var(--c-border)', 
                            borderRadius: '8px', 
                            padding: '1rem' 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                              <Avatar 
                                src={reply.user?.avatar} 
                                name={reply.user?.name ?? 'Admin'} 
                                size="sm" 
                              />
                              <div style={{ flex: 1 }}>
                                <h4 style={{ 
                                  fontWeight: '500', 
                                  color: 'var(--c-text)', 
                                  fontSize: '0.875rem',
                                  fontFamily: 'var(--font-head)'
                                }}>
                                  {reply.user?.name ?? 'Admin'}
                                </h4>
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  color: 'var(--c-muted)' 
                                }}>
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleDelete(reply.id)}
                                style={{
                                  padding: '0.5rem',
                                  background: 'rgba(224, 82, 82, 0.1)',
                                  color: 'var(--c-red)',
                                  borderRadius: '6px',
                                  transition: 'background-color 0.2s'
                                }}
                                title="Supprimer la réponse"
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(224, 82, 82, 0.2)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(224, 82, 82, 0.1)'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p style={{ 
                              color: 'var(--c-text)', 
                              fontSize: '0.875rem', 
                              lineHeight: 1.5, 
                              wordBreak: 'break-word' 
                            }}>
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}