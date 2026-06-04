import type { Tag } from '../../types'

interface TagBadgeProps {
  tag: Tag
  className?: string
}

export default function TagBadge({ tag, className = '' }: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)', border: '1px solid var(--border)' }}
    >
      #{tag.name}
    </span>
  )
}
