import type { ReactNode } from 'react'

export function EditorCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      className="editor-canvas"
      style={{
        background: 'var(--bg-canvas)',
        flex: 1,
        overflow: 'auto',
        padding: '40px 0',
      }}
    >
      {children}
    </div>
  )
}
