import type { ReactNode } from 'react'
import { usePageWidth } from '../hooks/usePageWidth'
import { PageResizeHandle } from './PageResizeHandle'

export function EditorPage({ children }: { children: ReactNode }) {
  const { pageWidth, startDrag, reset } = usePageWidth()
  return (
    <div
      className="editor-page"
      style={{
        background: 'var(--bg-page)',
        width: '100%',
        maxWidth: pageWidth,
        minHeight: 'calc(100vh - 200px)',
        borderRadius: 4,
        boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
        padding: '72px 80px',
        margin: '0 auto',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        position: 'relative',
      }}
    >
      <PageResizeHandle side="left" onDragStart={startDrag} onReset={reset} />
      <PageResizeHandle side="right" onDragStart={startDrag} onReset={reset} />
      {children}
    </div>
  )
}
