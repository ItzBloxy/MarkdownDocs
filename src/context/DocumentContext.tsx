import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DocumentState {
  docName: string
  isDirty: boolean
  isFavorited: boolean
  previewMode: boolean
}

interface DocumentContextValue extends DocumentState {
  setDocName: (name: string) => void
  markDirty: () => void
  markSaved: () => void
  toggleFavorite: () => void
  togglePreview: () => void
}

const DocumentContext = createContext<DocumentContextValue | null>(null)

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DocumentState>({
    docName: 'Untitled Document',
    isDirty: false,
    isFavorited: false,
    previewMode: false,
  })

  const setDocName = useCallback((name: string) => {
    setState(s => ({ ...s, docName: name }))
  }, [])

  const markDirty = useCallback(() => {
    setState(s => s.isDirty ? s : { ...s, isDirty: true })
  }, [])

  const markSaved = useCallback(() => {
    setState(s => !s.isDirty ? s : { ...s, isDirty: false })
  }, [])

  const toggleFavorite = useCallback(() => {
    setState(s => ({ ...s, isFavorited: !s.isFavorited }))
  }, [])

  const togglePreview = useCallback(() => {
    setState(s => ({ ...s, previewMode: !s.previewMode }))
  }, [])

  return (
    <DocumentContext.Provider
      value={{ ...state, setDocName, markDirty, markSaved, toggleFavorite, togglePreview }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocument() {
  const ctx = useContext(DocumentContext)
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider')
  return ctx
}
