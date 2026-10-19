import type { ReactNode } from 'react'

export function EditorCanvas({ children }: { children: ReactNode }) {
  return <main className="editor-canvas">{children}</main>
}
