import { useState, useRef, useEffect } from 'react'
import type { Editor } from '@tiptap/react'

interface LinkPopoverProps {
  editor: Editor
  onClose: () => void
}

export function LinkPopover({ editor, onClose }: LinkPopoverProps) {
  const currentLink = editor.getAttributes('link').href ?? ''
  const [url, setUrl] = useState(currentLink)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const apply = () => {
    const trimmed = url.trim()
    if (trimmed) {
      editor.chain().focus().setLink({ href: trimmed, target: '_blank', rel: 'noopener' }).run()
    }
    onClose()
  }

  const remove = () => {
    editor.chain().focus().unsetLink().run()
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
    <div className="link-popover">
      <input
        ref={inputRef}
        type="url"
        placeholder="https://example.com"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        className="link-popover-input"
      />
      <button className="link-popover-btn apply" onClick={apply}>
        Apply
      </button>
      {currentLink && (
        <button className="link-popover-btn remove" onClick={remove}>
          Remove
        </button>
      )}
    </div>
  )
}
