import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Eye, Heart, Bookmark, Edit2, Globe, GlobeLock, Pin, PinOff, Trash2 } from 'lucide-react'
import api from '../lib/api'
import type { Post, Tag, PaginatedResponse } from '../types'
import ConfirmModal from '../components/shared/ConfirmModal'
import Toast from '../components/shared/Toast'
import { useToast } from '../hooks/useToast'

const S = {
  btn: (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 500,
    cursor: 'pointer', transition: 'opacity 0.15s', border: 'none',
    backgroundColor: `${color}18`, color: color,
  }),
}

export default function PostsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const { toasts, removeToast, success, error } = useToast()

  const filterStatus = searchParams.get('status') ?? ''
  const filterTag = searchParams.get('tag') ?? ''

  useEffect(() => { api.get<Tag[]>('/tags').then(r => setTags(Array.isArray(r.data) ? r.data : [])).catch(() => {}) }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterStatus) params.status = filterStatus
    if (filterTag) params.tag = filterTag
    api.get<PaginatedResponse<Post> | Post[]>('/admin/posts', { params })
      .then(r => setPosts(Array.isArray(r.data) ? r.data : r.data.data ?? []))
      .catch(() => { setPosts([]); error('Erreur lors du chargement des articles.') })
      .finally(() => setLoading(false))
  }, [filterStatus, filterTag])

  const handlePublish = async (post: Post) => {
    setActionId(post.id)
    try {
      await api.patch(`/admin/posts/${post.id}/publish`)
      setPosts(p => p.map(x => x.id === post.id ? { ...x, status: x.status === 'published' ? 'draft' : 'published' } : x))
      success(post.status === 'published' ? 'Article dépublié.' : 'Article publié.')
    } catch { error('Erreur lors du changement de statut.') }
    finally { setActionId(null) }
  }

  const handlePin = async (post: Post) => {
    setActionId(post.id)
    try {
      await api.patch(`/admin/posts/${post.id}/pin`)
      setPosts(p => p.map(x => x.id === post.id ? { ...x, pinned: !x.pinned } : x))
      success(post.pinned ? 'Article désépinglé.' : 'Article épinglé.')
    } catch { error('Erreur lors de l\'épinglage.') }
    finally { setActionId(null) }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setActionId(deleteTarget.id)
    try {
      await api.delete(`/admin/posts/${deleteTarget.id}`)
      setPosts(p => p.filter(x => x.id !== deleteTarget.id))
      success('Article supprimé.')
    } catch { error('Erreur lors de la suppression.') }
    finally { setActionId(null); setDeleteTarget(null) }
  }

  const filterBtn = (val: string, label: string) => (
    <button key={val} onClick={() => setSearchParams(val ? { status: val } : {})}
      style={{ padding: '0.3rem 0.8rem', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: filterStatus === val ? 'var(--c-cyan-dim)' : 'var(--c-surface2)', color: filterStatus === val ? '#fff' : 'var(--c-sub)' }}>
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', color: 'var(--c-text)' }}>Articles</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '2px' }}>{posts.length} article{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/posts/new')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, background: 'var(--c-cyan-dim)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Nouveau post
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
        {filterBtn('', 'Tous')}
        {filterBtn('published', 'Publiés')}
        {filterBtn('draft', 'Brouillons')}
        {tags.map(t => (
          <button key={t.id} onClick={() => setSearchParams({ tag: t.slug })}
            style={{ padding: '0.3rem 0.8rem', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${filterTag === t.slug ? 'var(--c-cyan-dim)' : 'var(--c-border)'}`, background: filterTag === t.slug ? 'rgba(18,118,158,0.15)' : 'transparent', color: filterTag === t.slug ? 'var(--c-cyan)' : 'var(--c-muted)' }}>
            #{t.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...Array(5)].map((_, i) => <div key={i} style={{ height: '60px', borderRadius: '8px', background: 'var(--c-surface)', border: '1px solid var(--c-border)' }} />)}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--c-surface)', borderRadius: '10px', border: '1px solid var(--c-border)' }}>
          <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>Aucun article trouvé.</p>
          <button onClick={() => navigate('/posts/new')} style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--c-cyan-dim)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Créer le premier article
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {posts.map(post => (
            <div key={post.id}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--c-cyan-dim)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}>

              <div style={{ width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                {post.cover_image
                  ? <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" fill="none" stroke="#4A5878" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '3px', background: post.status === 'published' ? 'rgba(29,184,122,0.15)' : 'rgba(74,88,120,0.2)', color: post.status === 'published' ? 'var(--c-green)' : 'var(--c-muted)' }}>
                    {post.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                  {post.pinned && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '3px', background: 'rgba(18,118,158,0.15)', color: 'var(--c-cyan)' }}>Épinglé</span>}
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--c-muted)', flexShrink: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Eye size={12} /> {post.views_count}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Heart size={12} /> {post.likes_count ?? 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Bookmark size={12} /> {post.favorites_count ?? 0}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <button onClick={() => navigate(`/posts/${post.id}/edit`)} disabled={actionId === post.id} style={S.btn('#1A9BC4')}>
                  <Edit2 size={12} /> Modifier
                </button>
                <button onClick={() => handlePublish(post)} disabled={actionId === post.id} style={S.btn(post.status === 'published' ? '#4A5878' : '#1DB87A')}>
                  {post.status === 'published' ? <><GlobeLock size={12} /> Dépublier</> : <><Globe size={12} /> Publier</>}
                </button>
                <button onClick={() => handlePin(post)} disabled={actionId === post.id} style={S.btn(post.pinned ? '#1A9BC4' : '#4A5878')}>
                  {post.pinned ? <><PinOff size={12} /> Désépingler</> : <><Pin size={12} /> Épingler</>}
                </button>
                <button onClick={() => setDeleteTarget(post)} disabled={actionId === post.id} style={S.btn('#E05252')}>
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation suppression */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer « ${deleteTarget?.title} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toasts */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
