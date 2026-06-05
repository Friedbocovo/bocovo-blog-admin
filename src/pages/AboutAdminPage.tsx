import { useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, Plus, Trash2, Save, AlertCircle, CheckCircle, Globe, Link } from 'lucide-react'
import api from '../lib/api'

interface Section { title: string; content: string }
interface AboutData { bio: string | null; links: Record<string, string> | null; extra_sections: Section[] | null; profile_photo: string | null }

export default function AboutAdminPage() {
  const [bio, setBio] = useState('')
  const [links, setLinks] = useState<Record<string, string>>({ github: '', twitter: '', linkedin: '' })
  const [sections, setSections] = useState<Section[]>([])
  const [profilePhoto, setProfilePhoto] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    api.get<AboutData>('/about').then(r => {
      setBio(r.data.bio ?? '')
      setLinks({ github: '', twitter: '', linkedin: '', ...(r.data.links ?? {}) })
      setSections(r.data.extra_sections ?? [])
      setProfilePhoto(r.data.profile_photo ?? '')
    }).catch(() => {})
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      const filteredLinks = Object.fromEntries(Object.entries(links).filter(([, v]) => v.trim()))
      await api.put('/admin/about', { bio, links: filteredLinks, extra_sections: sections, profile_photo: profilePhoto })
      setMsg({ type: 'ok', text: 'Page À propos enregistrée.' })
    } catch { setMsg({ type: 'err', text: 'Erreur lors de l\'enregistrement.' }) }
    finally { setSaving(false) }
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
                <h3 style={{ fontFamily: 'var(--font-head)', color: 'var(--c-text)', marginBottom: '0.4rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--c-sub)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Photo de profil */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Globe size={14} style={{ color: 'var(--c-cyan)' }} /> Photo de profil (URL)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {profilePhoto && <img src={profilePhoto} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--c-cyan-dim)' }} />}
              <input type="url" value={profilePhoto} onChange={e => setProfilePhoto(e.target.value)} placeholder="https://…" style={inputStyle} />
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
              <button type="button" onClick={() => setSections(p => [...p, { title: '', content: '' }])}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 500, background: 'rgba(26,155,196,0.1)', color: 'var(--c-cyan)', border: '1px solid rgba(26,155,196,0.2)', cursor: 'pointer' }}>
                <Plus size={13} /> Ajouter
              </button>
            </div>
            {sections.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>Aucune section. Cliquez sur "Ajouter".</p>}
            {sections.map((s, i) => (
              <div key={i} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '1rem', marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" value={s.title} onChange={e => setSections(p => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                    placeholder="Titre de la section" style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={() => setSections(p => p.filter((_, j) => j !== i))}
                    style={{ width: '34px', height: '34px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(224,82,82,0.1)', color: 'var(--c-red)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea value={s.content} onChange={e => setSections(p => p.map((x, j) => j === i ? { ...x, content: e.target.value } : x))}
                  rows={3} placeholder="Contenu…" style={{ ...inputStyle, resize: 'vertical' }} />
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
