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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
      {editing ? (
        <input
          ref={inputRef}
          defaultValue={docName}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-light)',
            borderRadius: 4,
            padding: '2px 8px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            fontWeight: 500,
            outline: 'none',
            minWidth: 120,
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: 13,
            cursor: 'text',
          }}
        >
          {docName}
        </span>
      )}
      <button
        onClick={toggleFavorite}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          transition: 'all 0.15s ease',
          color: isFavorited ? 'var(--accent)' : 'var(--text-muted)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.15)'
          e.currentTarget.style.color = 'var(--accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.color = isFavorited ? 'var(--accent)' : 'var(--text-muted)'
        }}
      >
        <Star size={15} fill={isFavorited ? 'var(--accent)' : 'none'} />
      </button>
    </div>
  )
}
