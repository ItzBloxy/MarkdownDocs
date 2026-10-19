import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BookPlus, EyeOff } from 'lucide-react'

interface QuickCorrectProps {
  x: number
  y: number
  word: string
  suggestions: string[]
  onSelect: (replacement: string) => void
  onAddToDictionary: () => void
  onIgnore: () => void
  onClose: () => void
}

export function QuickCorrect({
  x, y, word, suggestions, onSelect, onAddToDictionary, onIgnore, onClose,
}: QuickCorrectProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Viewport clamping
  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let nx = x, ny = y
    if (x + rect.width > vw) nx = x - rect.width
    if (y + rect.height > vh) ny = y - rect.height
    if (nx < 0) nx = 4
    if (ny < 0) ny = 4

    ref.current.style.left = `${nx}px`
    ref.current.style.top = `${ny}px`
  }, [x, y])

  // Close on outside click, escape, scroll
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleScroll = () => onClose()

    // Delay listener registration to avoid closing on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
      document.addEventListener('scroll', handleScroll, true)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  return createPortal(
    <div ref={ref} className="menu quick-correct" role="menu" style={{ left: x, top: y }}>
      <span className="meta menu-label">Spelling — {word}</span>
      {suggestions.length > 0 ? (
        suggestions.map(s => (
          <button
            key={s}
            type="button"
            className="menu-item suggestion"
            onClick={() => onSelect(s)}
          >
            <span className="menu-item-label">{s}</span>
          </button>
        ))
      ) : (
        <div className="menu-item is-disabled">No suggestions</div>
      )}
      <div className="menu-sep" role="separator" />
      <button type="button" className="menu-item" onClick={() => { onAddToDictionary(); onClose() }}>
        <span className="menu-item-icon"><BookPlus size={15} /></span>
        <span className="menu-item-label">Add to dictionary</span>
      </button>
      <button type="button" className="menu-item" onClick={() => { onIgnore(); onClose() }}>
        <span className="menu-item-icon"><EyeOff size={15} /></span>
        <span className="menu-item-label">Ignore all</span>
      </button>
    </div>,
    document.body,
  )
}
