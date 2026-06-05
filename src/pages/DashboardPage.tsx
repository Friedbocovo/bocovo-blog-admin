import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { FileText, FileEdit, Eye, Heart, PenLine, MessageSquare, Mail, Info } from 'lucide-react'
import api from '../lib/api'
import type { Stats, Post } from '../types'

function StatCard({ label, value, icon, onClick }: { label: string; value: number | string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: '10px',
        padding: '1.25rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-cyan-dim)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        {onClick && <span style={{ fontSize: '0.75rem', color: 'var(--c-cyan)' }}>Voir →</span>}
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '0.25rem' }}>{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/admin/posts/stats'),
      api.get<{ data: Post[] } | Post[]>('/admin/posts'),
    ]).then(([sr, pr]) => {
      setStats(sr.data)
      setPosts(Array.isArray(pr.data) ? pr.data : pr.data.data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const chartData = posts
    .filter(p => p.status === 'published')
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 8)
    .map(p => ({
      name: p.title.length > 16 ? p.title.slice(0, 16) + '…' : p.title,
      vues: p.views_count,
      likes: p.likes_count ?? 0,
    }))

  const recentPosts = [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.25rem, 5vw, 1.6rem)', color: 'var(--c-text)' }}>Dashboard</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', marginTop: '0.2rem' }}>
          Vue d'ensemble — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: '100px', borderRadius: '10px', background: 'var(--c-surface)', border: '1px solid var(--c-border)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard label="Articles publiés" value={stats.published_posts} icon={<FileText size={20} />} onClick={() => navigate('/posts?status=published')} />
              <StatCard label="Brouillons" value={stats.draft_posts} icon={<FileEdit size={20} />} onClick={() => navigate('/posts?status=draft')} />
              <StatCard label="Vues totales" value={stats.total_views} icon={<Eye size={20} />} />
              <StatCard label="Likes totaux" value={stats.total_likes} icon={<Heart size={20} />} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
            {/* Graphique */}
            {chartData.length > 0 && (
              <div className="lg:col-span-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: 'clamp(1rem, 2vw, 1.25rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(0.875rem, 3vw, 1rem)', color: 'var(--c-text)' }}>Vues par article</h2>
                  <span style={{ fontSize: '0.72rem', color: 'var(--c-muted)' }}>Top {chartData.length}</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.8)" />
                    <XAxis dataKey="name" tick={{ fill: '#4A5878', fontSize: 10 }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fill: '#4A5878', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', fontSize: '0.8rem' }}
                      labelStyle={{ color: 'var(--c-text)' }}
                      itemStyle={{ color: 'var(--c-cyan)' }}
                    />
                    <Bar dataKey="vues" fill="var(--c-cyan-dim)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Articles récents */}
            <div className="lg:col-span-1" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: 'clamp(0.75rem, 2vw, 1.25rem)', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(0.875rem, 3vw, 1rem)', color: 'var(--c-text)' }}>Derniers articles</h2>
                <button onClick={() => navigate('/posts')} style={{ fontSize: '0.78rem', color: 'var(--c-cyan)', minHeight: '44px', minWidth: '44px', padding: '0.5rem' }} className="hover:opacity-80 transition-opacity">Voir tout →</button>
              </div>
              {recentPosts.map((post, i) => (
                <div key={post.id}
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                    borderBottom: i < recentPosts.length - 1 ? '1px solid var(--c-border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.15s', minHeight: '44px'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--c-surface2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    {post.cover_image
                      ? <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✍️</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.825rem)', fontWeight: 500, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap', minHeight: '20px' }}>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '3px', whiteSpace: 'nowrap',
                        background: post.status === 'published' ? 'rgba(29,184,122,0.15)' : 'rgba(74,88,120,0.3)',
                        color: post.status === 'published' ? 'var(--c-green)' : 'var(--c-muted)',
                      }}>
                        {post.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--c-muted)', whiteSpace: 'nowrap' }}>👁 {post.views_count}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentPosts.length === 0 && (
                <div style={{ padding: 'clamp(1.5rem, 5vw, 2rem)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)' }}>Aucun article encore.</p>
                  <button onClick={() => navigate('/posts/new')}
                    style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--c-cyan-dim)', color: '#fff', minHeight: '44px', minWidth: '44px' }} className="hover:opacity-90 transition-opacity">
                    Créer le premier
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
            {[
              { label: 'Nouvel article', Icon: PenLine, to: '/posts/new', color: 'var(--c-cyan-dim)' },
              { label: 'Commentaires', Icon: MessageSquare, to: '/comments', color: '#7C3AED' },
              { label: 'Messages', Icon: Mail, to: '/chat', color: '#059669' },
              { label: 'Page À propos', Icon: Info, to: '/about', color: '#D97706' },
            ].map(({ label, Icon, to, color }) => (
              <button key={to} onClick={() => navigate(to)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: 'clamp(0.5rem, 2vw, 0.75rem)', borderRadius: '8px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-sub)', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: 500, transition: 'border-color 0.15s, color 0.15s', cursor: 'pointer', minHeight: '44px', minWidth: '44px', flexWrap: 'wrap' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.color = 'var(--c-text)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-sub)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}20`, flexShrink: 0 }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
