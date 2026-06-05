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
      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      style={{
        minHeight: '120px',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div className="text-slate-400 group-hover:text-blue-500 transition-colors duration-200">
          {icon}
        </div>
        {onClick && (
          <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Voir →
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
        <p className="text-sm text-slate-600">{label}</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Vue d'ensemble — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <StatCard label="Articles publiés" value={stats.published_posts} icon={<FileText size={24} />} onClick={() => navigate('/posts?status=published')} />
              <StatCard label="Brouillons" value={stats.draft_posts} icon={<FileEdit size={24} />} onClick={() => navigate('/posts?status=draft')} />
              <StatCard label="Vues totales" value={stats.total_views} icon={<Eye size={24} />} />
              <StatCard label="Likes totaux" value={stats.total_likes} icon={<Heart size={24} />} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
            {/* Graphique */}
            {chartData.length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Vues par article</h2>
                  <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">Top {chartData.length}</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} angle={-30} textAnchor="end" height={80} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ 
                          background: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          fontSize: '14px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: '#1e293b' }}
                        itemStyle={{ color: '#0ea5e9' }}
                      />
                      <Bar dataKey="vues" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Articles récents */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Derniers articles</h2>
                <button 
                  onClick={() => navigate('/posts')} 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Voir tout →
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {recentPosts.map((post) => (
                  <div key={post.id}
                    onClick={() => navigate(`/posts/${post.id}/edit`)}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      {post.cover_image ? (
                        <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <FileText size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate text-sm">{post.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Eye size={12} />
                          {post.views_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentPosts.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText size={24} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 mb-4">Aucun article pour le moment</p>
                    <button 
                      onClick={() => navigate('/posts/new')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Créer le premier
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {[
              { label: 'Nouvel article', Icon: PenLine, to: '/posts/new', color: '#0ea5e9' },
              { label: 'Commentaires', Icon: MessageSquare, to: '/comments', color: '#8b5cf6' },
              { label: 'Messages', Icon: Mail, to: '/chat', color: '#10b981' },
              { label: 'Page À propos', Icon: Info, to: '/about', color: '#f59e0b' },
            ].map(({ label, Icon, to, color }) => (
              <button 
                key={to} 
                onClick={() => navigate(to)}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-200 group"
                style={{ minHeight: '120px' }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={24} style={{ color }} />
                  </div>
                  <span className="font-medium text-slate-900 group-hover:text-slate-700 transition-colors">
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
