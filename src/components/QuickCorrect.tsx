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
    <div ref={ref} className="quick-correct" style={{ left: x, top: y }}>
      {suggestions.length > 0 ? (
        suggestions.map(s => (
          <button
            key={s}
            className="qc-item qc-suggestion"
            onClick={() => onSelect(s)}
          >
            {s}
          </button>
        ))
      ) : (
        <div className="qc-item qc-empty">No suggestions</div>
      )}
      <div className="qc-divider" />
      <button className="qc-item qc-action" onClick={() => { onAddToDictionary(); onClose() }}>
        <BookPlus size={13} />
        Add to Dictionary
      </button>
      <button className="qc-item qc-action" onClick={() => { onIgnore(); onClose() }}>
        <EyeOff size={13} />
        Ignore
      </button>
    </div>,
    document.body,
  )
}
