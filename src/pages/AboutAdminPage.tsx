import { useEffect, useState, useRef, type FormEvent } from 'react'
import { Eye, EyeOff, Trash2, Save, AlertCircle, CheckCircle, Globe, Link, Upload, Camera, Type, Image, ExternalLink, FileText } from 'lucide-react'
import api from '../lib/api'

interface Section { 
  title: string
  content: string
  type: 'text' | 'image' | 'link' | 'other'
}
interface AboutData { 
  bio: string | null
  links: Record<string, string> | null
  extra_sections: Section[] | null
  profile_photo: string | null 
}

export default function AboutAdminPage() {
  const [bio, setBio] = useState('')
  const [links, setLinks] = useState<Record<string, string>>({ github: '', twitter: '', linkedin: '' })
  const [sections, setSections] = useState<Section[]>([])
  const [profilePhoto, setProfilePhoto] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [photoMode, setPhotoMode] = useState<'url' | 'upload'>('upload')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<AboutData>('/about').then(r => {
      setBio(r.data.bio ?? '')
      setLinks({ github: '', twitter: '', linkedin: '', ...(r.data.links ?? {}) })
      // Handle backward compatibility - add default type if missing
      const sectionsWithTypes = (r.data.extra_sections ?? []).map(section => ({
        ...section,
        type: (section as any).type || 'text' as const
      }))
      setSections(sectionsWithTypes)
      setProfilePhoto(r.data.profile_photo ?? '')
    }).catch(() => {})
  }, [])

  const handlePhotoUpload = async (file: File) => {
    if (!file) return
    setUploading(true)
    setMsg(null)
    
    try {
      const formData = new FormData()
      formData.append('photo', file)
      
      const res = await api.post<AboutData>('/admin/about/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setProfilePhoto(res.data.profile_photo ?? '')
      setMsg({ type: 'ok', text: 'Photo uploadée avec succès.' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur lors de l\'upload de la photo.' })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePhotoUpload(file)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      const filteredLinks = Object.fromEntries(Object.entries(links).filter(([, v]) => v.trim()))
      const saveData: any = { bio, links: filteredLinks, extra_sections: sections }
      
      // Only save profile_photo if using URL mode
      if (photoMode === 'url') {
        saveData.profile_photo = profilePhoto
      }
      
      await api.put('/admin/about', saveData)
      setMsg({ type: 'ok', text: 'Page À propos enregistrée.' })
    } catch { 
      setMsg({ type: 'err', text: 'Erreur lors de l\'enregistrement.' }) 
    }
    finally { setSaving(false) }
  }

  const addSection = (type: Section['type']) => {
    setSections(prev => [...prev, { title: '', content: '', type }])
  }

  const updateSection = (index: number, field: keyof Section, value: string) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index))
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.6rem 0.875rem', borderRadius: '8px', fontSize: '0.875rem',
    background: 'var(--c-surface2)', color: 'var(--c-text)',
    border: '1px solid var(--c-border)', outline: 'none', width: '100%',
  }

  const SOCIAL = [
    { key: 'github', label: 'GitHub', Icon: Link, ph: 'https://github.com/…' },
    { key: 'twitter', label: 'Twitter', Icon: Link, ph: 'https://twitter.com/…' },
    { key: 'linkedin', label: 'LinkedIn', Icon: Link, ph: 'https://linkedin.com/in/…' },
  ]

  const SECTION_TYPES = [
    { type: 'text' as const, label: 'Texte', Icon: Type, color: 'var(--c-blue)' },
    { type: 'image' as const, label: 'Image', Icon: Image, color: 'var(--c-green)' },
    { type: 'link' as const, label: 'Lien', Icon: ExternalLink, color: 'var(--c-purple)' },
    { type: 'other' as const, label: 'Autre', Icon: FileText, color: 'var(--c-orange)' },
  ]

  const getSectionIcon = (type: Section['type']) => {
    const sectionType = SECTION_TYPES.find(st => st.type === type)
    return sectionType ? <sectionType.Icon size={14} style={{ color: sectionType.color }} /> : <FileText size={14} />
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', color: 'var(--c-text)' }}>Page À propos</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '2px' }}>Gérez votre présentation publique</p>
        </div>
        <button onClick={() => setPreview(v => !v)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, background: preview ? 'rgba(26,155,196,0.15)' : 'var(--c-surface2)', color: preview ? 'var(--c-cyan)' : 'var(--c-sub)', border: `1px solid ${preview ? 'var(--c-cyan-dim)' : 'var(--c-border)'}`, cursor: 'pointer' }}>
          {preview ? <><EyeOff size={14} /> Éditer</> : <><Eye size={14} /> Prévisualiser</>}
        </button>
      </div>

      {preview ? (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '2rem', textAlign: 'center', borderBottom: '1px solid var(--c-border)', background: 'linear-gradient(135deg, var(--c-surface2), var(--c-surface))' }}>
            {profilePhoto && <img src={profilePhoto} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1rem', border: '2px solid var(--c-cyan-dim)' }} />}
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.25rem', color: 'var(--c-text)' }}>Bocovo Blog</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {Object.entries(links).filter(([, v]) => v).map(([k, v]) => (
                <a key={k} href={v} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', background: 'rgba(26,155,196,0.1)', color: 'var(--c-cyan)', border: '1px solid var(--c-border)', textDecoration: 'none' }}>
                  {k}
                </a>
              ))}
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {bio && <p style={{ color: 'var(--c-sub)', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{bio}</p>}
            {sections.map((s, i) => (
              <div key={i} style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-head)', color: 'var(--c-text)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {getSectionIcon(s.type)}
                  {s.title}
                </h3>
                {s.type === 'link' ? (
                  <a href={s.content} target="_blank" rel="noopener noreferrer" 
                    style={{ color: 'var(--c-cyan)', textDecoration: 'none', borderBottom: '1px solid var(--c-cyan-dim)' }}>
                    {s.content}
                  </a>
                ) : s.type === 'image' && s.content.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={s.content} alt={s.title} style={{ maxWidth: '100%', borderRadius: '6px', border: '1px solid var(--c-border)' }} />
                ) : (
                  <p style={{ color: 'var(--c-sub)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{s.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          {/* Photo de profil */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={14} style={{ color: 'var(--c-cyan)' }} /> Photo de profil
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" 
                  onClick={() => setPhotoMode('upload')}
                  style={{ 
                    padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
                    background: photoMode === 'upload' ? 'rgba(26,155,196,0.15)' : 'var(--c-surface2)', 
                    color: photoMode === 'upload' ? 'var(--c-cyan)' : 'var(--c-sub)', 
                    border: `1px solid ${photoMode === 'upload' ? 'var(--c-cyan-dim)' : 'var(--c-border)'}`, 
                    cursor: 'pointer' 
                  }}>
                  <Upload size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Upload
                </button>
                <button type="button" 
                  onClick={() => setPhotoMode('url')}
                  style={{ 
                    padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
                    background: photoMode === 'url' ? 'rgba(26,155,196,0.15)' : 'var(--c-surface2)', 
                    color: photoMode === 'url' ? 'var(--c-cyan)' : 'var(--c-sub)', 
                    border: `1px solid ${photoMode === 'url' ? 'var(--c-cyan-dim)' : 'var(--c-border)'}`, 
                    cursor: 'pointer' 
                  }}>
                  <Link size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />URL
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {profilePhoto && (
                <div style={{ position: 'relative' }}>
                  <img src={profilePhoto} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--c-cyan-dim)' }} />
                  {uploading && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  )}
                </div>
              )}
              
              {photoMode === 'upload' ? (
                <div style={{ flex: 1 }}>
                  <button type="button" 
                    onClick={() => fileRef.current?.click()} 
                    disabled={uploading}
                    style={{ 
                      ...inputStyle, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.5rem',
                      opacity: uploading ? 0.7 : 1 
                    }}>
                    <Camera size={16} />
                    {uploading ? 'Upload en cours…' : 'Choisir une photo'}
                  </button>
                  <input 
                    ref={fileRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)', marginTop: '0.4rem', textAlign: 'center' }}>
                    JPG, PNG, GIF, WebP — max 5 Mo
                  </p>
                </div>
              ) : (
                <input 
                  type="url" 
                  value={profilePhoto} 
                  onChange={e => setProfilePhoto(e.target.value)} 
                  placeholder="https://…" 
                  style={{ ...inputStyle, flex: 1 }} 
                />
              )}
            </div>
          </div>

          {/* Bio */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.75rem', display: 'block' }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={5} placeholder="Décrivez-vous…"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Liens sociaux */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.875rem', display: 'block' }}>Liens sociaux</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {SOCIAL.map(({ key, label, Icon, ph }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '90px', flexShrink: 0, fontSize: '0.8rem', color: 'var(--c-muted)' }}>
                    <Icon size={14} /> {label}
                  </div>
                  <input type="url" value={links[key] ?? ''} onChange={e => setLinks(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph} style={inputStyle} />
                </div>
              ))}
            </div>
          </div>

          {/* Sections personnalisées */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)' }}>Sections personnalisées</label>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {SECTION_TYPES.map(({ type, label, Icon, color }) => (
                  <button key={type} type="button" 
                    onClick={() => addSection(type)}
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem', 
                      padding: '0.25rem 0.5rem', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 500,
                      background: `rgba(26,155,196,0.08)`, color: color, 
                      border: `1px solid rgba(26,155,196,0.15)`, cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                    <Icon size={11} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {sections.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>Aucune section. Cliquez sur un type ci-dessus pour ajouter.</p>}
            {sections.map((s, i) => (
              <div key={i} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '1rem', marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--c-muted)', minWidth: 'fit-content' }}>
                    {getSectionIcon(s.type)}
                    {s.type}
                  </div>
                  <input type="text" 
                    value={s.title} 
                    onChange={e => updateSection(i, 'title', e.target.value)}
                    placeholder="Titre de la section" 
                    style={{ ...inputStyle, flex: 1 }} 
                  />
                  <select 
                    value={s.type} 
                    onChange={e => updateSection(i, 'type', e.target.value as Section['type'])}
                    style={{ 
                      ...inputStyle, 
                      width: 'auto', 
                      minWidth: '80px',
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.6rem'
                    }}>
                    {SECTION_TYPES.map(({ type, label }) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                  <button type="button" 
                    onClick={() => removeSection(i)}
                    style={{ 
                      width: '34px', height: '34px', borderRadius: '6px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(224,82,82,0.1)', color: 'var(--c-red)', 
                      border: 'none', cursor: 'pointer', flexShrink: 0 
                    }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea 
                  value={s.content} 
                  onChange={e => updateSection(i, 'content', e.target.value)}
                  rows={s.type === 'link' ? 2 : 3} 
                  placeholder={
                    s.type === 'text' ? 'Contenu textuel...' :
                    s.type === 'image' ? 'URL de l\'image ou description...' :
                    s.type === 'link' ? 'URL du lien...' :
                    'Contenu...'
                  } 
                  style={{ ...inputStyle, resize: 'vertical' }} 
                />
              </div>
            ))}
          </div>

          {msg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', background: msg.type === 'ok' ? 'rgba(29,184,122,0.1)' : 'rgba(224,82,82,0.1)', color: msg.type === 'ok' ? 'var(--c-green)' : 'var(--c-red)', border: `1px solid ${msg.type === 'ok' ? 'rgba(29,184,122,0.2)' : 'rgba(224,82,82,0.2)'}` }}>
              {msg.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {msg.text}
            </div>
          )}

          <button type="submit" disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, background: 'var(--c-cyan-dim)', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            <Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      )}
    </div>
  )
}
