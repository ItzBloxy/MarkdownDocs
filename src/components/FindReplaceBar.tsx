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

  return (
    <div className="find-replace-bar">
      <div className="find-row">
        <input
          ref={findRef}
          type="text"
          placeholder="Find..."
          value={findValue}
          onChange={e => setFindValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="find-input"
        />
        <span className="find-count">
          {searchState.matchCount > 0
            ? `${searchState.currentIndex + 1} of ${searchState.matchCount}`
            : findValue ? 'No results' : ''}
        </span>
        <button className="find-nav-btn" onClick={() => editor?.commands.prevSearchMatch()} title="Previous (Shift+Enter)" disabled={searchState.matchCount === 0}>
          <ChevronUp size={14} />
        </button>
        <button className="find-nav-btn" onClick={() => editor?.commands.nextSearchMatch()} title="Next (Enter)" disabled={searchState.matchCount === 0}>
          <ChevronDown size={14} />
        </button>
        <button
          className={`find-nav-btn ${showReplace ? 'active' : ''}`}
          onClick={() => setShowReplace(!showReplace)}
          title="Toggle Replace"
          style={{ fontSize: 11, width: 'auto', padding: '0 6px' }}
        >
          Replace
        </button>
        <button className="find-nav-btn" onClick={handleClose} title="Close (Escape)">
          <X size={14} />
        </button>
      </div>
      {showReplace && (
        <div className="replace-row">
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceValue}
            onChange={e => setReplaceValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="find-input"
          />
          <button
            className="replace-btn"
            onClick={() => editor?.commands.replaceSearchMatch(replaceValue)}
            disabled={searchState.matchCount === 0}
          >
            Replace
          </button>
          <button
            className="replace-btn"
            onClick={() => editor?.commands.replaceAllSearchMatches(replaceValue)}
            disabled={searchState.matchCount === 0}
          >
            Replace All
          </button>
        </div>
      )}
    </div>
  )
}
