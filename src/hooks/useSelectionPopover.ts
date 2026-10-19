import { useCallback, useEffect, useLayoutEffect, type RefObject } from 'react'
import type { Editor } from '@tiptap/react'

const GAP = 8
const EDGE = 12

// Pins a fixed-position popover under the editor selection (flipping above it
// when there's no room below), keeps it there on scroll/resize, and closes it
// on a click outside.
export function useSelectionPopover(editor: Editor, ref: RefObject<HTMLElement | null>, onClose: () => void) {
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
  }, [editor, ref])

  useLayoutEffect(() => {
    place()
  }, [place])

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
  }, [onClose, place, ref])
}
