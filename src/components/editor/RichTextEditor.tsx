import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlock from '@tiptap/extension-code-block'
import Blockquote from '@tiptap/extension-blockquote'
import { Bold, Italic, Link2, ImageIcon, List, ListOrdered, Code, Quote, Upload } from 'lucide-react'
import { useRef } from 'react'

interface Props { content: string; onChange: (html: string) => void; readonly?: boolean }

function ToolBtn({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      style={{
        width: '32px', height: '32px', borderRadius: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(26,155,196,0.2)' : 'transparent',
        color: active ? 'var(--c-cyan)' : 'var(--c-sub)',
        border: `1px solid ${active ? 'rgba(26,155,196,0.3)' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.15s',
      }}>
      {children}
    </button>
  )
}

export default function RichTextEditor({ content, onChange, readonly = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, blockquote: false }),
      Link.configure({ openOnClick: false }),
      Image,
      CodeBlock,
      Blockquote,
    ],
    content,
    editable: !readonly,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  // Insérer un lien
  const addLink = () => {
    const url = window.prompt('URL du lien :')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  // Insérer une image par URL
  const addImageByUrl = () => {
    const url = window.prompt("URL de l'image :")
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  // Upload image depuis le PC
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      if (src) editor.chain().focus().setImage({ src }).run()
    }
    reader.readAsDataURL(file)
    // Reset input pour permettre re-upload du même fichier
    e.target.value = ''
  }

  return (
    <div>
      {!readonly && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '0.625rem 1rem', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface2)', alignItems: 'center' }}>
          {/* Formatage texte */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras">
            <Bold size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique">
            <Italic size={14} />
          </ToolBtn>

          <div style={{ width: '1px', height: '20px', background: 'var(--c-border)', margin: '0 4px' }} />

          {/* Lien & images */}
          <ToolBtn onClick={addLink} active={editor.isActive('link')} title="Insérer un lien">
            <Link2 size={14} />
          </ToolBtn>

          <ToolBtn onClick={addImageByUrl} title="Insérer une image par URL">
            <ImageIcon size={14} />
          </ToolBtn>

          {/* Upload image depuis PC */}
          <ToolBtn onClick={() => fileInputRef.current?.click()} title="Uploader une image depuis l'ordinateur">
            <Upload size={14} />
          </ToolBtn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          <div style={{ width: '1px', height: '20px', background: 'var(--c-border)', margin: '0 4px' }} />

          {/* Listes */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">
            <List size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
            <ListOrdered size={14} />
          </ToolBtn>

          <div style={{ width: '1px', height: '20px', background: 'var(--c-border)', margin: '0 4px' }} />

          {/* Code & citation */}
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Bloc de code">
            <Code size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
            <Quote size={14} />
          </ToolBtn>

          {/* Légende */}
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Upload size={11} /> = upload depuis PC
          </span>
        </div>
      )}

      <EditorContent
        editor={editor}
        style={{
          minHeight: '280px', padding: '1rem 1.25rem',
          background: 'var(--c-surface)', color: 'var(--c-text)',
          fontSize: '0.9rem', lineHeight: 1.75, cursor: 'text',
        }}
      />
    </div>
  )
}
