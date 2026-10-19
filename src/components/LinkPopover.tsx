import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { Link } from 'lucide-react'

interface LinkPopoverProps {
  editor: Editor
  onClose: () => void
}

const GAP = 8
const EDGE = 12

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

  // Anchor under the selection; flip above it when there's no room below.
  const place = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { from, to } = editor.state.selection
    const start = editor.view.coordsAtPos(from)
    const end = editor.view.coordsAtPos(to)
    const { offsetWidth: w, offsetHeight: h } = el
    let left = Math.min(start.left, end.left) - 10
    let top = end.bottom + GAP
    if (top + h > window.innerHeight - EDGE) top = start.top - h - GAP
    left = Math.max(EDGE, Math.min(left, window.innerWidth - w - EDGE))
    top = Math.max(EDGE, top)
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  }, [editor])

  useLayoutEffect(() => {
    place()
  }, [place])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [onClose, place])

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
