import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { DocumentProvider, useDocument } from './context/DocumentContext'
import { ThemeProvider } from './context/ThemeContext'
import { TitleMenuBar } from './components/TitleMenuBar'
import { Toolbar } from './components/Toolbar'
import { FindReplaceBar } from './components/FindReplaceBar'
import { EditorCanvas } from './components/EditorCanvas'
import { EditorPage } from './components/EditorPage'
import { StatusBar } from './components/StatusBar'
import { LinkPopover } from './components/LinkPopover'
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal'
import { ToastContainer } from './components/Toast'
import { SlashCommandPalette } from './components/SlashCommandPalette'
import { ConflictBar } from './components/ConflictBar'
import { DesktopGate } from './components/DesktopGate'
import { ContextMenu } from './components/ContextMenu'
import { useEditorSetup } from './hooks/useEditorSetup'
import { useEditorStats } from './hooks/useEditorStats'
import { useFileSystem } from './hooks/useFileSystem'
import { useContextMenu } from './hooks/useContextMenu'
import './styles/chrome.css'
import './styles/overlays.css'
import './styles/editor.css'
import './styles/table.css'
import './styles/find-replace.css'
import './styles/context-menu.css'
import './styles/print.css'

function EditorApp() {
  const { isDirty, markDirty, markSaved, setDocName } = useDocument()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const [showFind, setShowFind] = useState(false)

  const onUpdate = useCallback(() => {
    markDirty()
  }, [markDirty])

  const editor = useEditorSetup(onUpdate)
  const stats = useEditorStats(editor)
  const fs = useFileSystem(editor, isDirty, markSaved, setDocName)
  const { menu: ctxMenu, close: closeCtx } = useContextMenu()

  // Notify file watcher about typing
  useEffect(() => {
    if (!editor) return
    editor.on('update', fs.onTyping)
    return () => { editor.off('update', fs.onTyping) }
  }, [editor, fs.onTyping])

  // Beforeunload (browser-mode fallback)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Track isDirty in a ref so the Tauri close handler can read its current value
  // without re-registering the listener on every change (which races: the unlisten
  // is set asynchronously, so a second effect run can register a duplicate listener
  // before the first one's unlisten resolves — leaving multiple handlers attached).
  const isDirtyRef = useRef(isDirty)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  // Tauri window close: prompt on unsaved changes via native dialog.
  // Register once on mount and read isDirty through a ref so the listener never
  // re-registers (re-registering races: unlistenFn is set asynchronously, so a
  // second effect run could leave duplicate listeners attached). preventDefault
  // must fire synchronously — Tauri only honors it before the handler's first
  // await — so the dialog is run out-of-band, and the window is closed via
  // win.destroy() if the user confirms (requires core:window:allow-destroy).
  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return
    let cancelled = false
    let unlistenFn: (() => void) | null = null
    ;(async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      if (cancelled) return
      const win = getCurrentWindow()
      const fn = await win.onCloseRequested((event) => {
        if (!isDirtyRef.current) return
        event.preventDefault()
        ;(async () => {
          const { ask } = await import('@tauri-apps/plugin-dialog')
          const shouldClose = await ask('You have unsaved changes. Close anyway?', {
            title: 'MarkdownDocs',
            kind: 'warning',
          })
          if (shouldClose) await win.destroy()
        })()
      })
      if (cancelled) fn()
      else unlistenFn = fn
    })()
    return () => { cancelled = true; unlistenFn?.() }
  }, [])

  // Global keyboard handlers
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey

      if (e.key === 'Escape') {
        if (showFind) { setShowFind(false); e.preventDefault(); return }
        if (showShortcuts) { setShowShortcuts(false); e.preventDefault(); return }
        if (showLinkPopover) { setShowLinkPopover(false); e.preventDefault(); return }
      }

      if (mod && e.key === 'k') { e.preventDefault(); setShowLinkPopover(prev => !prev) }
      if (mod && e.key === 'f') { e.preventDefault(); setShowFind(prev => !prev) }

      // File operations
      if (mod && e.key === 's' && !e.shiftKey) { e.preventDefault(); fs.saveFile() }
      if (mod && e.key === 's' && e.shiftKey) { e.preventDefault(); fs.saveAs() }
      if (mod && e.key === 'o') { e.preventDefault(); fs.openFile() }
      if (mod && e.key === 'n') { e.preventDefault(); fs.newDocument() }
      if (mod && e.key === 'r' && e.shiftKey) { e.preventDefault(); fs.revertToSaved() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showShortcuts, showLinkPopover, showFind, fs])

  const handleLinkClick = () => setShowLinkPopover(true)
  const handleOpenFind = () => setShowFind(true)

  return (
    <div className="app-shell">
      <TitleMenuBar
        editor={editor}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onLinkClick={handleLinkClick}
        onOpenFind={handleOpenFind}
        fileSystem={fs}
      />
      <Toolbar editor={editor} onLinkClick={handleLinkClick} />
      {showFind && (
        <FindReplaceBar editor={editor} onClose={() => setShowFind(false)} />
      )}
      <EditorCanvas>
        {fs.conflict && (
          <ConflictBar
            onReload={() => fs.resolveConflict('reload')}
            onKeep={() => fs.resolveConflict('keep')}
          />
        )}
        <EditorPage>
          <EditorContent editor={editor} />
        </EditorPage>
      </EditorCanvas>
      <StatusBar
        wordCount={stats.wordCount}
        charCount={stats.charCount}
        lineCount={stats.lineCount}
        pageCount={stats.pageCount}
        onOpenShortcuts={() => setShowShortcuts(true)}
        fileState={fs.fileState}
      />
      {showLinkPopover && editor && (
        <LinkPopover editor={editor} onClose={() => setShowLinkPopover(false)} />
      )}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
      {ctxMenu.visible && editor && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          context={ctxMenu.context}
          targetEl={ctxMenu.targetEl}
          editor={editor}
          onClose={closeCtx}
          onRequestLink={handleLinkClick}
        />
      )}
      <SlashCommandPalette editor={editor} />
      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <DesktopGate>
        <DocumentProvider>
          <EditorApp />
        </DocumentProvider>
      </DesktopGate>
    </ThemeProvider>
  )
}
