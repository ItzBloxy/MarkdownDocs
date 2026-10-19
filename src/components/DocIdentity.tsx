import { useState, useRef, useEffect } from 'react'
import { Star } from 'lucide-react'
import { useDocument } from '../context/DocumentContext'

export function DocIdentity() {
  const { docName, setDocName, isFavorited, toggleFavorite } = useDocument()
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select()
    }
  }, [editing])

  const handleBlur = () => {
    setEditing(false)
    if (inputRef.current && inputRef.current.value.trim()) {
      setDocName(inputRef.current.value.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  return (
    <div className="doc-identity">
      {editing ? (
        <input
          ref={inputRef}
          className="field doc-name-input"
          aria-label="Document name"
          defaultValue={docName}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          type="button"
          className="doc-name"
          title="Rename document"
          onClick={() => setEditing(true)}
        >
          {docName}
        </button>
      )}
      <button
        type="button"
        className={`icon-btn icon-btn-bare fav-btn ${isFavorited ? 'is-on' : ''}`}
        onClick={toggleFavorite}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={isFavorited}
      >
        <Star size={16} strokeWidth={2} fill={isFavorited ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
