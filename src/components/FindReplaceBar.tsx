import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import type { SearchState } from '../extensions/SearchAndReplace'

interface FindReplaceBarProps {
  editor: Editor | null
  onClose: () => void
}

export function FindReplaceBar({ editor, onClose }: FindReplaceBarProps) {
  const [findValue, setFindValue] = useState('')
  const [replaceValue, setReplaceValue] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [searchState, setSearchState] = useState<SearchState>({
    query: '', matchCount: 0, currentIndex: 0,
  })
  const findRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    findRef.current?.focus()
  }, [])

  // Subscribe to search state via storage listeners
  useEffect(() => {
    if (!editor) return
    const storage = (editor as any).extensionStorage?.searchAndReplace
    if (!storage) return
    storage.listeners.push(setSearchState)
    return () => {
      const idx = storage.listeners.indexOf(setSearchState)
      if (idx >= 0) storage.listeners.splice(idx, 1)
    }
  }, [editor])

  // Update search when find value changes
  useEffect(() => {
    editor?.commands.setSearchQuery(findValue)
  }, [findValue, editor])

  // However the bar closes (its own Escape, the global one, Ctrl+F), drop the highlights
  useEffect(() => {
    return () => { editor?.commands.setSearchQuery('') }
  }, [editor])

  // Clear search on close
  const handleClose = () => {
    editor?.commands.setSearchQuery('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      editor?.commands.nextSearchMatch()
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      editor?.commands.prevSearchMatch()
    }
  }

  const hasResults = searchState.matchCount > 0

  return (
    <div className="find-replace-bar" role="search">
      <div className="find-row">
        <span className="meta find-label">Find</span>
        <input
          ref={findRef}
          type="text"
          placeholder="Search this document"
          aria-label="Find"
          value={findValue}
          onChange={e => setFindValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="field find-input"
        />
        <span className={`find-count ${hasResults ? 'has-results' : ''}`} aria-live="polite">
          {hasResults
            ? `${String(searchState.currentIndex + 1).padStart(2, '0')} / ${String(searchState.matchCount).padStart(2, '0')}`
            : findValue ? 'No matches' : ''}
        </span>
        <button
          type="button"
          className="icon-btn has-tip"
          onClick={() => editor?.commands.prevSearchMatch()}
          aria-label="Previous match"
          data-tip="Previous  Shift+Enter"
          disabled={!hasResults}
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          className="icon-btn has-tip"
          onClick={() => editor?.commands.nextSearchMatch()}
          aria-label="Next match"
          data-tip="Next  Enter"
          disabled={!hasResults}
        >
          <ChevronDown size={16} />
        </button>
        <button
          type="button"
          className={`btn ${showReplace ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setShowReplace(!showReplace)}
          aria-expanded={showReplace}
        >
          <span className={showReplace ? undefined : 'btn-label'}>Replace</span>
        </button>
        <div className="find-spacer" />
        <button
          type="button"
          className="icon-btn icon-btn-bare has-tip tip-end"
          onClick={handleClose}
          aria-label="Close find"
          data-tip="Close  Esc"
        >
          <X size={16} />
        </button>
      </div>
      {showReplace && (
        <div className="replace-row">
          <span className="meta find-label">Replace</span>
          <input
            type="text"
            placeholder="Replace with"
            aria-label="Replace with"
            value={replaceValue}
            onChange={e => setReplaceValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="field find-input"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => editor?.commands.replaceSearchMatch(replaceValue)}
            disabled={!hasResults}
          >
            Replace
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => editor?.commands.replaceAllSearchMatches(replaceValue)}
            disabled={!hasResults}
          >
            Replace all
          </button>
        </div>
      )}
    </div>
  )
}
