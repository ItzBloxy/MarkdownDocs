import type { PointerEvent } from 'react'

type Side = 'left' | 'right'

interface Props {
  side: Side
  onDragStart: (e: PointerEvent<HTMLElement>, side: Side) => void
  onReset: () => void
}

export function PageResizeHandle({ side, onDragStart, onReset }: Props) {
  return (
    <div
      className={`page-resize-handle is-${side}`}
      title="Drag to resize the page. Double-click to reset."
      onPointerDown={(e) => onDragStart(e, side)}
      onDoubleClick={onReset}
    />
  )
}
