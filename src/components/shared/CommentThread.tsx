import { useState } from 'react'
import type { Comment } from '../../types'
import Avatar from './Avatar'

interface CommentThreadProps {
  comments: Comment[]
  onReply: (parentId: number, content: string) => Promise<void>
  onDelete?: (commentId: number) => Promise<void>
}

function CommentItem({ comment, onReply, onDelete, depth }: {
  comment: Comment; onReply: (id: number, c: string) => Promise<void>
  onDelete?: (id: number) => Promise<void>; depth: number
}) {
  const [showReply, setShowReply] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try { await onReply(comment.id, content.trim()); setContent(''); setShowReply(false) }
    finally { setSubmitting(false) }
  }

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
      <Avatar src={comment.user?.avatar} name={comment.user?.name ?? '?'} size="sm" className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{comment.user?.name ?? '?'}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(comment.created_at).toLocaleDateString('fr-FR')}</span>
            {comment.post && <span className="text-xs" style={{ color: 'var(--accent)' }}>sur «{comment.post.title}»</span>}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
        </div>
        <div className="flex gap-3 mt-1 px-1">
          <button onClick={() => setShowReply(v => !v)} className="text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }}>Répondre</button>
          {onDelete && <button onClick={() => onDelete(comment.id)} className="text-xs hover:opacity-80" style={{ color: 'var(--danger)' }}>Supprimer</button>}
        </div>
        {showReply && (
          <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
            <input type="text" value={content} onChange={e => setContent(e.target.value)} placeholder="Votre réponse… (@mention)"
              className="flex-1 text-sm rounded-lg px-3 py-2 outline-none" autoFocus
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
            <button type="submit" disabled={submitting || !content.trim()} className="text-sm px-3 py-2 rounded-lg font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: '#0A0A0F' }}>{submitting ? '…' : 'Envoyer'}</button>
          </form>
        )}
        {comment.replies?.map(reply => (
          <CommentItem key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} depth={depth + 1} />
        ))}
      </div>
    </div>
  )
}

export default function CommentThread({ comments, onReply, onDelete }: CommentThreadProps) {
  if (comments.length === 0) {
    return <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Aucun commentaire.</p>
  }
  return <div>{comments.map(c => <CommentItem key={c.id} comment={c} onReply={onReply} onDelete={onDelete} depth={0} />)}</div>
}
