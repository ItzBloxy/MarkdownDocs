import { Keyboard, Link2 } from 'lucide-react'
import { useDocument } from '../context/DocumentContext'
import type { FileSystemState } from '../hooks/useFileSystem'

interface StatusBarProps {
  wordCount: number
  charCount: number
  lineCount: number
  pageCount: number
  onOpenShortcuts?: () => void
  fileState?: FileSystemState
}

export function StatusBar({ wordCount, charCount, lineCount, pageCount, onOpenShortcuts, fileState }: StatusBarProps) {
  const { isDirty } = useDocument()

  const linkLabel = fileState?.isLinked
    ? (fileState.watcherStatus === 'paused' ? 'Linked (paused)' : 'Linked')
    : 'Local only'
  const linkColor = fileState?.isLinked
    ? (fileState.watcherStatus === 'paused' ? 'var(--accent-dim)' : 'var(--success)')
    : 'var(--text-muted)'

  return (
    <div
      className="status-bar"
      style={{
        background: '#0e0915',
        padding: '5px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        borderTop: '1px solid var(--border-primary)',
        fontSize: 11,
        color: 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--font-ui)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <span>Words: {wordCount}</span>
      <span>Chars: {charCount}</span>
      <span>Lines: {lineCount}</span>
      <span>Pages: {pageCount}</span>
      <div style={{ flex: 1 }} />
      {/* File link indicator */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: linkColor }}>
        <Link2 size={11} />
        {linkLabel}
      </span>
      {/* Save state */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isDirty ? 'var(--accent)' : 'var(--success)',
            display: 'inline-block',
            transition: 'background 0.3s ease',
          }}
        />
        {isDirty ? 'Unsaved' : 'Saved'}
      </span>
      <button
        onClick={onOpenShortcuts}
        aria-label="Keyboard shortcuts"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: 3,
          display: 'flex',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'none'
          e.currentTarget.style.color = 'var(--text-muted)'
        }}
      >
        <Keyboard size={13} />
      </button>
    </div>
  )
}
