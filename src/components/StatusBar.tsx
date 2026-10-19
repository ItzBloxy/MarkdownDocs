import { Keyboard, Link2, Link2Off } from 'lucide-react'
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

  const isLinked = !!fileState?.isLinked
  const isPaused = isLinked && fileState?.watcherStatus === 'paused'
  const linkLabel = isLinked ? (isPaused ? 'Linked, paused' : 'Linked') : 'Local only'

  return (
    <footer className="status-bar">
      <span className="status-stat">Words<b>{wordCount}</b></span>
      <span className="status-stat">Chars<b>{charCount}</b></span>
      <span className="status-stat">Lines<b>{lineCount}</b></span>
      <span className="status-stat">Pages<b>{pageCount}</b></span>
      <div className="status-spacer" />
      <span className={`status-item ${isLinked && !isPaused ? 'is-live' : ''}`}>
        {isLinked ? <Link2 size={13} /> : <Link2Off size={13} />}
        {linkLabel}
      </span>
      <span className={`status-item ${isDirty ? 'is-live' : ''}`} aria-live="polite">
        <span className={`status-square ${isDirty ? 'is-on' : ''}`} aria-hidden="true" />
        {isDirty ? 'Unsaved' : 'Saved'}
      </span>
      <button
        type="button"
        onClick={onOpenShortcuts}
        aria-label="Keyboard shortcuts"
        data-tip="Keyboard shortcuts"
        className="icon-btn icon-btn-bare status-btn has-tip tip-top tip-end"
      >
        <Keyboard size={15} />
      </button>
    </footer>
  )
}
