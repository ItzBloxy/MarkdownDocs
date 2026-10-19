import { useState, useRef, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { Upload } from 'lucide-react'
import { useSelectionPopover } from '../hooks/useSelectionPopover'
import { imageFilesIn, insertImageFiles } from '../utils/imageFiles'
import { setImagePopoverOpener } from '../utils/imagePopover'

// "cdn.example.com/pic.png" → https://…; relative paths ("img/pic.png",
// "pic.png") and anything with a scheme stay as typed
function normalizeSrc(raw: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw
  return /^[^/\s]+\.[^/\s]+\//.test(raw) ? `https://${raw}` : raw
}

interface ImagePopoverProps {
  editor: Editor
  onClose: () => void
}

function ImagePopover({ editor, onClose }: ImagePopoverProps) {
  // With an image selected the popover edits it; otherwise it inserts at the caret
  const [existing] = useState(() =>
    editor.isActive('image') ? (editor.getAttributes('image') as { src: string; alt: string | null }) : null)
  const isEmbedded = !!existing?.src.startsWith('data:')
  const [src, setSrc] = useState(existing && !isEmbedded ? existing.src : '')
  const [alt, setAlt] = useState(existing?.alt ?? '')
  const ref = useRef<HTMLDivElement>(null)
  const srcRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useSelectionPopover(editor, ref, onClose)

  useEffect(() => {
    srcRef.current?.focus()
    srcRef.current?.select()
  }, [])

  const canApply = !!src.trim() || !!existing
  const apply = () => {
    const url = src.trim()
    const description = alt.trim() || null
    if (existing) {
      editor.chain().focus().updateAttributes('image', { src: url ? normalizeSrc(url) : existing.src, alt: description }).run()
    } else if (url) {
      editor.chain().focus().setImage({ src: normalizeSrc(url), alt: description ?? undefined }).run()
    }
    onClose()
  }

  const remove = () => {
    editor.chain().focus().deleteSelection().run()
    onClose()
  }

  const upload = async (files: FileList | null) => {
    const images = imageFilesIn(files).slice(0, 1)
    if (images.length === 0) return
    onClose()
    await insertImageFiles(editor, images, undefined, alt.trim() || undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (canApply) apply()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div ref={ref} className="image-popover" role="dialog" aria-label={existing ? 'Edit image' : 'Insert image'}>
      <label className="image-popover-field">
        <span className="meta">Address</span>
        <input
          ref={srcRef}
          className="field"
          type="text"
          value={src}
          placeholder={isEmbedded ? 'Embedded image. Paste an address to replace it.' : 'https://example.com/picture.png'}
          onChange={e => setSrc(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </label>
      <label className="image-popover-field">
        <span className="meta">Description</span>
        <input
          className="field"
          type="text"
          value={alt}
          placeholder="What the image shows"
          onChange={e => setAlt(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </label>
      <div className="image-popover-actions">
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={15} />
          <span className="btn-label">Upload from computer</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => void upload(e.target.files)}
        />
        <div className="image-popover-spacer" />
        {existing && (
          <button type="button" className="btn btn-ghost" onClick={remove}>
            <span className="btn-label">Remove</span>
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={apply} disabled={!canApply}>
          {existing ? 'Update image' : 'Insert image'}
        </button>
      </div>
    </div>
  )
}

export function ImagePopoverHost({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    setImagePopoverOpener(() => setOpen(true))
    return () => setImagePopoverOpener(null)
  }, [])

  if (!open || !editor) return null
  return <ImagePopover editor={editor} onClose={close} />
}
