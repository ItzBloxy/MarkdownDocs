import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { useDocument } from '../context/DocumentContext'

export const DEFAULT_PAGE_WIDTH = 816
export const MIN_PAGE_WIDTH = 500
export const MAX_PAGE_WIDTH = 1200

type Side = 'left' | 'right'

interface UsePageWidthResult {
  pageWidth: number
  startDrag: (e: PointerEvent<HTMLElement>, side: Side) => void
  reset: () => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function usePageWidth(): UsePageWidthResult {
  const { docName } = useDocument()
  const [pageWidth, setPageWidth] = useState<number>(DEFAULT_PAGE_WIDTH)
  const widthRef = useRef(pageWidth)
  widthRef.current = pageWidth

  useEffect(() => {
    setPageWidth(DEFAULT_PAGE_WIDTH)
  }, [docName])

  const reset = useCallback(() => {
    setPageWidth(DEFAULT_PAGE_WIDTH)
  }, [])

  const startDrag = useCallback((e: PointerEvent<HTMLElement>, side: Side) => {
    e.preventDefault()
    const target = e.currentTarget
    const pointerId = e.pointerId
    const startX = e.clientX
    const startWidth = widthRef.current

    target.setPointerCapture(pointerId)

    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'

    const onMove = (ev: globalThis.PointerEvent) => {
      const delta = ev.clientX - startX
      const next = side === 'right' ? startWidth + 2 * delta : startWidth - 2 * delta
      setPageWidth(clamp(next, MIN_PAGE_WIDTH, MAX_PAGE_WIDTH))
    }

    const cleanup = () => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId)
      }
      document.body.style.userSelect = previousUserSelect
    }

    const onUp = () => {
      cleanup()
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }, [])

  return { pageWidth, startDrag, reset }
}
