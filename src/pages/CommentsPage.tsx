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
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
        Commentaires
      </h1>

      {comments.length === 0 ? (
        <p className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>Aucun commentaire.</p>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              {/* En-tête */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{comment.user?.name ?? '?'}</span>
                  {comment.post && (
                    <>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>sur</span>
                      <span className="text-xs" style={{ color: 'var(--accent)' }}>«{comment.post.title}»</span>
                    </>
                  )}
                  {comment.parent_id && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>réponse</span>}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {/* Contenu */}
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button onClick={() => setReplyForms(p => ({ ...p, [comment.id]: p[comment.id] ?? `@${comment.user?.name} ` }))}
                  className="text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                  Répondre
                </button>
                <button onClick={() => handleDelete(comment.id)} className="text-xs hover:opacity-80" style={{ color: 'var(--danger)' }}>
                  Supprimer
                </button>
              </div>

              {/* Formulaire de réponse inline */}
              {replyForms[comment.id] !== undefined && (
                <div className="flex gap-2 mt-3">
                  <input type="text" value={replyForms[comment.id]}
                    onChange={e => setReplyForms(p => ({ ...p, [comment.id]: e.target.value }))}
                    placeholder="Votre réponse… (@mention supportée)"
                    className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                  <button onClick={() => handleReply(comment.id)} disabled={submitting === comment.id || !replyForms[comment.id]?.trim()}
                    className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent)', color: '#0A0A0F' }}>
                    {submitting === comment.id ? '…' : 'Répondre'}
                  </button>
                </div>
              )}

              {/* Réponses */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 ml-6 space-y-3">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{reply.user?.name}</span>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{reply.content}</p>
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
