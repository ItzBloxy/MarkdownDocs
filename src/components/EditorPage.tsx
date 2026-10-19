import type { ReactNode } from 'react'
import { usePageWidth } from '../hooks/usePageWidth'
import { PageResizeHandle } from './PageResizeHandle'

export function EditorPage({ children }: { children: ReactNode }) {
  const { pageWidth, startDrag, reset } = usePageWidth()
  return (
    <div className="editor-page" style={{ maxWidth: pageWidth }}>
      <PageResizeHandle side="left" onDragStart={startDrag} onReset={reset} />
      <PageResizeHandle side="right" onDragStart={startDrag} onReset={reset} />
      {children}
    </div>
  )
}
