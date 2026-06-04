import type { Post } from '../../types'
import TagBadge from './TagBadge'

interface PostCardProps {
  post: Post
  onClick?: () => void
}

export default function PostCard({ post, onClick }: PostCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl overflow-hidden ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      {post.cover_image && (
        <img src={post.cover_image} alt={post.title} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {post.pinned && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent)', color: '#0A0A0F' }}>📌</span>}
          <span className={`text-xs px-2 py-0.5 rounded`}
            style={{ backgroundColor: post.status === 'published' ? 'rgba(29,158,117,0.2)' : 'rgba(154,152,148,0.2)', color: post.status === 'published' ? 'var(--success)' : 'var(--text-muted)' }}>
            {post.status === 'published' ? 'Publié' : 'Brouillon'}
          </span>
        </div>
        <h3 className="font-semibold mb-1 line-clamp-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          {post.title}
        </h3>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.slice(0, 3).map((tag) => <TagBadge key={tag.id} tag={tag} />)}
          </div>
        )}
        <div className="flex gap-3 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>👁 {post.views_count}</span>
          {post.likes_count !== undefined && <span>❤️ {post.likes_count}</span>}
          {post.comments_count !== undefined && <span>💬 {post.comments_count}</span>}
        </div>
      </div>
    </div>
  )
}
