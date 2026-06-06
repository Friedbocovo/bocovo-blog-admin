import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { Camera, Save, User, Mail, Globe, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../stores/authStore'
import type { User as UserType } from '../types'

export default function ProfileAdminPage() {
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [website, setWebsite] = useState(user?.website ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      const payload: Record<string, string> = { name, bio, website }
      if (password) payload.password = password
      const res = await api.put<UserType>('/profile', payload)
      setUser(res.data); setMsg({ type: 'ok', text: 'Profil mis à jour avec succès.' }); setPassword('')
    } catch { setMsg({ type: 'err', text: 'Erreur lors de la mise à jour.' }) }
    finally { setSaving(false) }
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(true)
    try {
      const form = new FormData(); form.append('avatar', file)
      const res = await api.post<UserType>('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUser(res.data); setAvatarPreview(res.data.avatar)
    } catch { } finally { setUploading(false) }
  }

  if (!user) return null

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem', borderRadius: '8px',
    fontSize: '0.875rem', background: 'var(--c-bg)',
    color: 'var(--c-text)', border: '1px solid var(--c-border)', outline: 'none',
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1rem 2rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color: 'var(--c-text)', marginBottom: '0.5rem' }}>Mon profil</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--c-sub)', marginTop: '2px' }}>Gérez vos informations personnelles</p>
      </div>

      {/* Avatar card */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--c-border)' }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #12769E, #1A9BC4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                  {user.name[0].toUpperCase()}
                </div>
            }
          </div>
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
        </div>
        <div>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: '2px' }}>{user.name}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>{user.email}</p>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.875rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, background: 'var(--c-bg)', color: 'var(--c-sub)', border: '1px solid var(--c-border)', cursor: 'pointer', opacity: uploading ? 0.5 : 1 }}>
            <Camera size={13} /> {uploading ? 'Upload…' : 'Changer la photo'}
          </button>
          <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)', marginTop: '0.3rem' }}>JPG, PNG — max 5 Mo</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--c-sub)', marginBottom: '0.4rem' }}>
              <User size={13} /> Nom
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--c-sub)', marginBottom: '0.4rem' }}>
              <Globe size={13} /> Site web
            </label>
            <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--c-sub)', marginBottom: '0.4rem' }}>
            <Mail size={13} /> Email <span style={{ color: 'var(--c-muted)', fontWeight: 400, fontSize: '0.75rem' }}>(non modifiable)</span>
          </label>
          <input type="email" value={user.email} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--c-sub)', marginBottom: '0.4rem', display: 'block' }}>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            style={{ ...inputStyle, resize: 'none' }} />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--c-sub)', marginBottom: '0.4rem' }}>
            <Lock size={13} /> Nouveau mot de passe
            <span style={{ color: 'var(--c-muted)', fontWeight: 400, fontSize: '0.75rem' }}>(laisser vide pour ne pas changer)</span>
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" style={inputStyle} />
        </div>

        {msg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', background: msg.type === 'ok' ? 'rgba(29,184,122,0.1)' : 'rgba(224,82,82,0.1)', color: msg.type === 'ok' ? 'var(--c-green)' : 'var(--c-red)', border: `1px solid ${msg.type === 'ok' ? 'rgba(29,184,122,0.2)' : 'rgba(224,82,82,0.2)'}` }}>
            {msg.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {msg.text}
          </div>
        )}

        <button type="submit" disabled={saving}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, background: 'var(--c-cyan)', color: 'var(--c-cream)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          <Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
