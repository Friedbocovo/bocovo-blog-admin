import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { Comment } from '../types'

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyForms, setReplyForms] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState<number | null>(null)

  useEffect(() => {
    // Récupère tous les commentaires (admin voit tout)
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
      setReplyForms(prev => ({ ...prev, [commentId]: '' }))
    } catch { /* ignore */ }
    finally { setSubmitting(null) }
  }

  const handleDelete = async (commentId: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return
    await api.delete(`/comments/${commentId}`)
    const remove = (list: Comment[]): Comment[] =>
      list.filter(c => c.id !== commentId).map(c => ({ ...c, replies: remove(c.replies ?? []) }))
    setComments(prev => remove(prev))
  }

  if (loading) return <div className="animate-pulse h-32 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }} />

  return (
    <div className="w-full">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 px-4 md:px-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
        Commentaires
      </h1>

      {comments.length === 0 ? (
        <p className="text-center py-12 md:py-16 text-sm px-4" style={{ color: 'var(--text-muted)' }}>Aucun commentaire.</p>
      ) : (
        <div className="space-y-3 md:space-y-4 px-4 md:px-0">
          {comments.map(comment => (
            <div key={comment.id} className="rounded-lg md:rounded-xl p-3 md:p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              {/* En-tête */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 md:mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                  <span className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{comment.user?.name ?? '?'}</span>
                  {comment.post && (
                    <>
                      <span className="hidden sm:inline text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                      <span className="text-xs truncate" style={{ color: 'var(--accent)' }}>«{comment.post.title}»</span>
                    </>
                  )}
                  {comment.parent_id && <span className="text-xs px-2 py-0.5 rounded w-fit" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>réponse</span>}
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {/* Contenu */}
              <p className="text-sm md:text-base mb-3 md:mb-4 break-words" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <button 
                  onClick={() => setReplyForms(p => ({ ...p, [comment.id]: p[comment.id] ?? `@${comment.user?.name} ` }))}
                  className="min-h-11 min-w-11 px-3 py-2 text-xs md:text-sm rounded hover:opacity-80 transition-opacity flex items-center justify-center"
                  style={{ color: 'var(--text-muted)' }}
                  title="Répondre">
                  Répondre
                </button>
                <button 
                  onClick={() => handleDelete(comment.id)}
                  className="min-h-11 min-w-11 px-3 py-2 text-xs md:text-sm rounded hover:opacity-80 transition-opacity flex items-center justify-center"
                  style={{ color: 'var(--danger)' }}
                  title="Supprimer">
                  Supprimer
                </button>
              </div>

              {/* Formulaire de réponse inline */}
              {replyForms[comment.id] !== undefined && (
                <div className="flex flex-col sm:flex-row gap-2 mt-3 md:mt-4">
                  <input 
                    type="text" 
                    value={replyForms[comment.id]}
                    onChange={e => setReplyForms(p => ({ ...p, [comment.id]: e.target.value }))}
                    placeholder="Votre réponse… (@mention supportée)"
                    className="flex-1 min-h-11 text-xs md:text-sm rounded-lg md:rounded-xl px-3 py-2 md:py-3 outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                  <button 
                    onClick={() => handleReply(comment.id)} 
                    disabled={submitting === comment.id || !replyForms[comment.id]?.trim()}
                    className="min-h-11 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity w-full sm:w-auto"
                    style={{ backgroundColor: 'var(--accent)', color: '#0A0A0F' }}>
                    {submitting === comment.id ? '…' : 'Répondre'}
                  </button>
                </div>
              )}

              {/* Réponses */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 md:mt-4 ml-0 sm:ml-4 md:ml-6 space-y-2 md:space-y-3 border-l-2 md:border-l-2 pl-3 md:pl-4" style={{ borderLeftColor: 'var(--border)' }}>
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="rounded-lg p-2 md:p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <span className="text-xs md:text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }}>{reply.user?.name}</span>
                      <p className="text-xs md:text-sm mt-1 break-words" style={{ color: 'var(--text-secondary)' }}>{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
