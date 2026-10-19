import { useState, useRef, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { Link } from 'lucide-react'
import { useSelectionPopover } from '../hooks/useSelectionPopover'

interface LinkPopoverProps {
  editor: Editor
  onClose: () => void
}

// Tiptap's Link rejects scheme-less addresses, so "example.com" would silently
// do nothing. Assume https unless it's already a scheme, an anchor or a path.
function normalizeHref(raw: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || /^[#/.?]/.test(raw)) return raw
  return `https://${raw}`
}

export function LinkPopover({ editor, onClose }: LinkPopoverProps) {
  const currentLink = editor.getAttributes('link').href ?? ''
  const [url, setUrl] = useState(currentLink)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useSelectionPopover(editor, ref, onClose)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const apply = () => {
    const trimmed = url.trim()
    if (trimmed) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: normalizeHref(trimmed), target: '_blank', rel: 'noopener' }).run()
    }
    onClose()
  }

  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      apply()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div ref={ref} className="link-popover" role="dialog" aria-label={currentLink ? 'Edit link' : 'Add link'}>
      <span className="link-popover-icon" aria-hidden="true"><Link size={16} /></span>
      <input
        ref={inputRef}
        type="url"
        placeholder="https://example.com"
        aria-label="Link address"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        className="field"
      />
      {currentLink && (
        <button type="button" className="btn btn-ghost" onClick={remove}>
          <span className="btn-label">Remove</span>
        </button>
      )}
      <button type="button" className="btn btn-primary" onClick={apply}>
        {currentLink ? 'Update' : 'Add link'}
      </button>
    </div>
  )
}
