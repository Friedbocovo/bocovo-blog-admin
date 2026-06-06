import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlock from '@tiptap/extension-code-block'
import Blockquote from '@tiptap/extension-blockquote'
import { Bold, Italic, Link2, ImageIcon, List, ListOrdered, Code, Quote, Upload } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

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
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, blockquote: false }),
      Link.configure({ openOnClick: false }),
      Image.configure({
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; cursor: pointer;'
        }
      }),
      CodeBlock,
      Blockquote,
    ],
    content,
    editable: !readonly,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Mettre à jour le contenu quand il change de l'extérieur
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  // Gestion du clic sur les images pour les agrandir
  useEffect(() => {
    const handleImageClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        const src = target.getAttribute('src')
        if (src) {
          setEnlargedImage(src)
          e.preventDefault()
        }
      }
    }

    const editorElement = document.querySelector('.ProseMirror')
    if (editorElement) {
      editorElement.addEventListener('click', handleImageClick)
      return () => editorElement.removeEventListener('click', handleImageClick)
    }
  }, [editor])

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

  // Upload images multiples depuis le PC
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const src = ev.target?.result as string
          if (src) {
            editor.chain().focus().setImage({ 
              src,
              alt: file.name,
              title: 'Cliquez pour agrandir'
            }).run()
          }
        }
        reader.readAsDataURL(file)
      }
    })
    
    // Reset input pour permettre re-upload
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

          {/* Upload images multiples depuis PC */}
          <ToolBtn onClick={() => fileInputRef.current?.click()} title="Uploader des images depuis l'ordinateur">
            <Upload size={14} />
          </ToolBtn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
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
            <Upload size={11} /> = upload multiple depuis PC
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

      {/* Modal d'agrandissement d'image */}
      {enlargedImage && (
        <div 
          className="image-modal"
          onClick={() => setEnlargedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
        >
          <img 
            src={enlargedImage} 
            alt="Image agrandie"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
