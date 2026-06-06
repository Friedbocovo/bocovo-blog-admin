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
  const [isMobile, setIsMobile] = useState(false)

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontFamily: 'var(--font-head)', 
          fontWeight: 'bold', 
          color: 'var(--c-text)', 
          marginBottom: '0.5rem',
          lineHeight: 1.2
        }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--c-sub)', fontSize: '0.95rem' }}>
          Vue d'ensemble — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '2rem' 
        }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ 
              background: 'var(--c-surface)', 
              borderRadius: '12px', 
              border: '1px solid var(--c-border)', 
              height: '128px' 
            }} className="animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem', 
              marginBottom: '2rem' 
            }}>
              <StatCard label="Articles publiés" value={stats.published_posts} icon={<FileText size={24} />} onClick={() => navigate('/posts?status=published')} />
              <StatCard label="Brouillons" value={stats.draft_posts} icon={<FileEdit size={24} />} onClick={() => navigate('/posts?status=draft')} />
              <StatCard label="Vues totales" value={stats.total_views} icon={<Eye size={24} />} />
              <StatCard label="Likes totaux" value={stats.total_likes} icon={<Heart size={24} />} />
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr)', 
            gap: '2rem', 
            marginBottom: '2rem' 
          }}>
            {/* Graphique */}
            {chartData.length > 0 && (
              <div style={{ 
                background: 'var(--c-surface)', 
                borderRadius: '12px', 
                border: '1px solid var(--c-border)', 
                padding: '1.5rem' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: 'var(--c-text)',
                    fontFamily: 'var(--font-head)'
                  }}>
                    Vues par article
                  </h2>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--c-muted)', 
                    background: 'var(--c-surface2)', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '8px',
                    border: '1px solid var(--c-border)'
                  }}>
                    Top {chartData.length}
                  </span>
                </div>
                <div style={{ height: isMobile ? '20rem' : '16rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ 
                      top: 20, 
                      right: isMobile ? 10 : 30, 
                      left: isMobile ? 10 : 20, 
                      bottom: isMobile ? 80 : 60 
                    }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'var(--c-muted)', fontSize: isMobile ? 10 : 12 }} 
                        angle={-30} 
                        textAnchor="end" 
                        height={80} 
                      />
                      <YAxis tick={{ fill: 'var(--c-muted)', fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip
                        contentStyle={{ 
                          background: 'var(--c-surface)', 
                          border: `1px solid var(--c-border)`, 
                          borderRadius: '8px', 
                          fontSize: '14px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                          color: 'var(--c-text)'
                        }}
                        labelStyle={{ color: 'var(--c-text)' }}
                        itemStyle={{ color: 'var(--c-cyan)' }}
                      />
                      <Bar dataKey="vues" fill="var(--c-cyan)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Articles récents */}
            <div style={{ 
              background: 'var(--c-surface)', 
              borderRadius: '12px', 
              border: '1px solid var(--c-border)', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1.5rem', 
                borderBottom: '1px solid var(--c-border)' 
              }}>
                <h2 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'var(--c-text)',
                  fontFamily: 'var(--font-head)'
                }}>
                  Derniers articles
                </h2>
                <button 
                  onClick={() => navigate('/posts')} 
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--c-cyan)',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--c-cyan-dim)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--c-cyan)'}
                >
                  Voir tout →
                </button>
              </div>
              <div>
                {recentPosts.map((post) => (
                  <div key={post.id}
                    onClick={() => navigate(`/posts/${post.id}/edit`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      borderBottom: '1px solid var(--c-border)'
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-surface2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                  >
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'var(--c-surface2)',
                      flexShrink: 0
                    }}>
                      {post.cover_image ? (
                        <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'var(--c-muted)' 
                        }}>
                          <FileText size={20} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        fontWeight: '500', 
                        color: 'var(--c-text)', 
                        fontSize: '0.875rem',
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {post.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: post.status === 'published' ? 'rgba(29, 184, 122, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: post.status === 'published' ? 'var(--c-green)' : 'var(--c-orange)',
                          border: `1px solid ${post.status === 'published' ? 'rgba(29, 184, 122, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                        }}>
                          {post.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--c-muted)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem' 
                        }}>
                          <Eye size={12} />
                          {post.views_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentPosts.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: 'var(--c-surface2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem'
                    }}>
                      <FileText size={24} style={{ color: 'var(--c-muted)' }} />
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--c-sub)', marginBottom: '1rem' }}>
                      Aucun article pour le moment
                    </p>
                    <button 
                      onClick={() => navigate('/posts/new')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.5rem 1rem',
                        background: 'var(--c-cyan)',
                        color: 'var(--c-cream)',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-cyan-dim)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-cyan)'}
                    >
                      Créer le premier
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {[
              { label: 'Nouvel article', Icon: PenLine, to: '/posts/new', color: 'var(--c-cyan)' },
              { label: 'Commentaires', Icon: MessageSquare, to: '/comments', color: 'var(--c-purple)' },
              { label: 'Messages', Icon: Mail, to: '/chat', color: 'var(--c-green)' },
              { label: 'Page À propos', Icon: Info, to: '/about', color: 'var(--c-orange)' },
            ].map(({ label, Icon, to, color }) => (
              <button 
                key={to} 
                onClick={() => navigate(to)}
                style={{
                  background: 'var(--c-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--c-border)',
                  padding: '1.5rem',
                  minHeight: '120px',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  const btn = e.currentTarget as HTMLElement
                  btn.style.borderColor = 'var(--c-cyan-dim)'
                  btn.style.transform = 'translateY(-2px)'
                  const icon = btn.querySelector('.action-icon') as HTMLElement
                  if (icon) icon.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  const btn = e.currentTarget as HTMLElement
                  btn.style.borderColor = 'var(--c-border)'
                  btn.style.transform = 'translateY(0)'
                  const icon = btn.querySelector('.action-icon') as HTMLElement
                  if (icon) icon.style.transform = 'scale(1)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center', 
                  gap: '0.75rem' 
                }}>
                  <div 
                    className="action-icon"
                    style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: `${color}15`,
                      transition: 'transform 0.2s'
                    }}
                  >
                    <Icon size={24} style={{ color }} />
                  </div>
                  <span style={{ 
                    fontWeight: '500', 
                    color: 'var(--c-text)',
                    fontSize: '0.95rem',
                    transition: 'color 0.2s'
                  }}>
                    {label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
