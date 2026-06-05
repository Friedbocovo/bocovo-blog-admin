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
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Commentaires</h1>
          <p className="text-slate-600 mt-1">Gérez les commentaires de vos visiteurs</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Chargement des commentaires...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Commentaires</h1>
        <p className="text-slate-600 mt-1">Gérez et répondez aux commentaires de vos visiteurs</p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par contenu, auteur ou article..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les commentaires</option>
                <option value="recent">Récents (7 jours)</option>
                <option value="with_replies">Avec réponses</option>
              </select>
            </div>
            
            <div className="text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
              {filteredComments.length} commentaire{filteredComments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des commentaires */}
      {filteredComments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <MessageSquare size={32} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchQuery || filterStatus !== 'all' ? 'Aucun commentaire trouvé' : 'Aucun commentaire'}
          </h3>
          <p className="text-slate-600 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'all' 
              ? 'Essayez de modifier vos critères de recherche ou filtres.'
              : 'Les commentaires de vos visiteurs apparaîtront ici.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map(comment => (
            <div key={comment.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
              {/* En-tête du commentaire */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar 
                      src={comment.user?.avatar} 
                      name={comment.user?.name ?? 'Utilisateur'} 
                      size="md" 
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {comment.user?.name ?? 'Utilisateur anonyme'}
                        </h3>
                        {comment.parent_id && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                            Réponse
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                        {comment.post && (
                          <div className="flex items-center gap-1">
                            <ExternalLink size={14} />
                            <span className="truncate max-w-[200px]">
                              {comment.post.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setReplyForms(p => ({ 
                        ...p, 
                        [comment.id]: p[comment.id] !== undefined ? undefined : `@${comment.user?.name} ` 
                      }))}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      title="Répondre"
                    >
                      <Reply size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Contenu du commentaire */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="text-slate-800 leading-relaxed break-words">{comment.content}</p>
                </div>
                {/* Formulaire de réponse */}
                {replyForms[comment.id] !== undefined && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-4">
                    <div className="flex flex-col gap-3">
                      <label className="text-sm font-medium text-blue-800">
                        Répondre à {comment.user?.name}
                      </label>
                      <textarea 
                        value={replyForms[comment.id]}
                        onChange={e => setReplyForms(p => ({ ...p, [comment.id]: e.target.value }))}
                        placeholder="Tapez votre réponse... (@mention supportée)"
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setReplyForms(p => ({ ...p, [comment.id]: undefined }))}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={() => handleReply(comment.id)} 
                          disabled={submitting === comment.id || !replyForms[comment.id]?.trim()}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {submitting === comment.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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

                {/* Réponses */}
                {comment.replies && comment.replies.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleExpanded(comment.id)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 mb-3 transition-colors"
                    >
                      <div className={`transition-transform duration-200 ${
                        expandedComments.has(comment.id) ? 'rotate-90' : ''
                      }`}>
                        ▶
                      </div>
                      {comment.replies.length} réponse{comment.replies.length > 1 ? 's' : ''}
                    </button>
                    
                    {expandedComments.has(comment.id) && (
                      <div className="space-y-3 pl-6 border-l-2 border-slate-200">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="bg-white border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar 
                                src={reply.user?.avatar} 
                                name={reply.user?.name ?? 'Admin'} 
                                size="sm" 
                              />
                              <div>
                                <h4 className="font-medium text-slate-900 text-sm">
                                  {reply.user?.name ?? 'Admin'}
                                </h4>
                                <span className="text-xs text-slate-500">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleDelete(reply.id)}
                                className="ml-auto p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                                title="Supprimer la réponse"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed break-words">
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