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
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 8,
        [side]: -4,
        cursor: 'ew-resize',
        touchAction: 'none',
        zIndex: 1,
      }}
      onPointerDown={(e) => onDragStart(e, side)}
      onDoubleClick={onReset}
    />
  )
}
