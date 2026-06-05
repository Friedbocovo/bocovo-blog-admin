import { useEffect, useState, useRef, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Eye, EyeOff, Save, Send, Image, Tag, X, Plus, FileText } from 'lucide-react'
import api from '../lib/api'
import type { Post, Tag as TagType } from '../types'
import RichTextEditor from '../components/editor/RichTextEditor'

export default function PostEditorPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'published'>('draft')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [allTags, setAllTags] = useState<TagType[]>([])
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.875rem', borderRadius: '8px',
    fontSize: '0.9rem', background: 'var(--c-surface2)',
    color: 'var(--c-text)', border: '1px solid var(--c-border)', outline: 'none',
    transition: 'border-color 0.15s',
  }

  useEffect(() => {
    api.get<TagType[]>('/tags').then(r => setAllTags(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    api.get<Post>(`/admin/posts/${id}`)
      .then(r => {
        setTitle(r.data.title)
        setExcerpt(r.data.excerpt ?? '')
        setContent(r.data.content)
        setCurrentStatus(r.data.status as 'draft' | 'published')
        setSelectedTags(r.data.tags?.map(t => t.id) ?? [])
        if (r.data.cover_image) setCoverPreview(r.data.cover_image)
      })
      .catch(() => navigate('/posts'))
  }, [id, isEdit, navigate])

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = ev => setCoverPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async (status?: 'draft' | 'published') => {
    if (!title.trim()) return
    const statusToSave = status ?? currentStatus
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('excerpt', excerpt)
      formData.append('content', content)
      formData.append('status', statusToSave)
      selectedTags.forEach(id => formData.append('tags[]', String(id)))
      if (coverFile) formData.append('cover_image', coverFile)
      if (isEdit && id) {
        await api.put(`/admin/posts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post('/admin/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      navigate('/posts')
    } catch { } finally { setSaving(false) }
  }

  const handleAddTag = () => {
    if (!newTagName.trim()) return
    const tempTag: TagType = { id: -(Date.now()), name: newTagName.trim(), slug: newTagName.trim().toLowerCase().replace(/\s+/g, '-') }
    setAllTags(prev => [...prev, tempTag])
    setSelectedTags(prev => [...prev, tempTag.id])
    setNewTagName('')
  }

  const toggleTag = (tagId: number) =>
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId])

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', color: 'var(--c-text)' }}>
            {isEdit ? 'Modifier l\'article' : 'Nouvel article'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '2px' }}>
            {isEdit ? 'Modifiez et sauvegardez vos modifications' : 'Rédigez et publiez un nouvel article'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setPreview(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, background: preview ? 'rgba(26,155,196,0.15)' : 'var(--c-surface)', color: preview ? 'var(--c-cyan)' : 'var(--c-sub)', border: `1px solid ${preview ? 'var(--c-cyan-dim)' : 'var(--c-border)'}`, cursor: 'pointer' }}>
            {preview ? <><EyeOff size={14} /> Éditer</> : <><Eye size={14} /> Aperçu</>}
          </button>
          {isEdit && (
            <button onClick={() => handleSave()} disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(29,184,122,0.15)', color: 'var(--c-green)', border: '1px solid rgba(29,184,122,0.3)', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              <Save size={14} /> Enregistrer
            </button>
          )}
          <button onClick={() => handleSave('draft')} disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, background: 'var(--c-surface)', color: 'var(--c-sub)', border: '1px solid var(--c-border)', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            <Save size={14} /> Brouillon
          </button>
          <button onClick={() => handleSave('published')} disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--c-cyan-dim)', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            <Send size={14} /> Publier
          </button>
        </div>
      </div>

      {preview ? (
        /* Mode prévisualisation */
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', overflow: 'hidden' }}>
          {coverPreview && <img src={coverPreview} alt="cover" style={{ width: '100%', height: '280px', objectFit: 'cover' }} />}
          <div style={{ padding: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color: 'var(--c-text)', marginBottom: '0.75rem' }}>{title || 'Sans titre'}</h1>
            {excerpt && <p style={{ fontSize: '1rem', color: 'var(--c-sub)', fontStyle: 'italic', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--c-border)' }}>{excerpt}</p>}
            <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Titre */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.6rem' }}>
              <FileText size={14} style={{ color: 'var(--c-cyan)' }} /> Titre <span style={{ color: 'var(--c-red)' }}>*</span>
            </label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Titre de l'article"
              style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 600 }}
              onFocus={e => (e.target.style.borderColor = 'var(--c-cyan-dim)')}
              onBlur={e => (e.target.style.borderColor = 'var(--c-border)')} />
          </div>

          {/* Extrait */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.6rem', display: 'block' }}>
              Extrait <span style={{ color: 'var(--c-muted)', fontWeight: 400 }}>(résumé court)</span>
            </label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
              placeholder="Un résumé accrocheur de l'article…"
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => (e.target.style.borderColor = 'var(--c-cyan-dim)')}
              onBlur={e => (e.target.style.borderColor = 'var(--c-border)')} />
          </div>

          {/* Image de couverture */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.75rem' }}>
              <Image size={14} style={{ color: 'var(--c-cyan)' }} /> Image de couverture
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {coverPreview ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={coverPreview} alt="cover" style={{ width: '120px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--c-border)' }} />
                  <button type="button" onClick={() => { setCoverPreview(null); setCoverFile(null) }}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--c-red)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()}
                  style={{ width: '120px', height: '72px', borderRadius: '6px', border: '2px dashed var(--c-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', color: 'var(--c-muted)', flexShrink: 0 }}>
                  <Image size={18} />
                  <span style={{ fontSize: '0.68rem' }}>Choisir</span>
                </div>
              )}
              <div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.875rem', borderRadius: '6px', fontSize: '0.8rem', background: 'var(--c-surface2)', color: 'var(--c-sub)', border: '1px solid var(--c-border)', cursor: 'pointer', fontWeight: 500 }}>
                  <Image size={13} /> {coverPreview ? 'Changer l\'image' : 'Choisir une image'}
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)', marginTop: '0.3rem' }}>JPG, PNG, WebP — max 5 Mo</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
          </div>

          {/* Tags */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.75rem' }}>
              <Tag size={14} style={{ color: 'var(--c-cyan)' }} /> Tags
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {allTags.map(tag => (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${selectedTags.includes(tag.id) ? 'var(--c-cyan-dim)' : 'var(--c-border)'}`, background: selectedTags.includes(tag.id) ? 'rgba(18,118,158,0.2)' : 'transparent', color: selectedTags.includes(tag.id) ? 'var(--c-cyan)' : 'var(--c-muted)', transition: 'all 0.15s' }}>
                  #{tag.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)}
                placeholder="Nouveau tag…"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={handleAddTag}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0 0.875rem', borderRadius: '8px', background: 'var(--c-surface2)', color: 'var(--c-sub)', border: '1px solid var(--c-border)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                <Plus size={14} /> Ajouter
              </button>
            </div>
          </div>

          {/* Éditeur TipTap */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={14} style={{ color: 'var(--c-cyan)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)' }}>Contenu</span>
            </div>
            <div style={{ padding: '0' }}>
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
