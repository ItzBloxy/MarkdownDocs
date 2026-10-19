import { useState, useRef, useCallback, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { isTauri } from '@tauri-apps/api/core'
import { open as tauriOpen, save as tauriSave } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile, stat, watch } from '@tauri-apps/plugin-fs'
import { markdownToHtml } from '../utils/markdownImport'
import { editorToMarkdown } from '../utils/markdownExport'

export interface FileSystemState {
  isLinked: boolean
  watcherStatus: 'linked' | 'paused' | 'unlinked'
  fileName: string
}

const hasFileSystemAccess = typeof window !== 'undefined' && 'showOpenFilePicker' in window
const inTauri = isTauri()

function basename(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

export function useFileSystem(editor: Editor | null, isDirty: boolean, markSaved: () => void, setDocName: (n: string) => void) {
  const handleRef = useRef<FileSystemFileHandle | null>(null)
  const pathRef = useRef<string | null>(null)
  const unwatchRef = useRef<(() => void) | null>(null)
  const selfWritingRef = useRef(false)
  const lastModifiedRef = useRef<number>(0)
  const watcherRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const typingRef = useRef(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [fileState, setFileState] = useState<FileSystemState>({
    isLinked: false,
    watcherStatus: 'unlinked',
    fileName: '',
  })
  const [conflict, setConflict] = useState<{ diskContent: string } | null>(null)

  // Track typing for watcher pause (browser mode only; Tauri mode ignores).
  const onTyping = useCallback(() => {
    typingRef.current = true
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => { typingRef.current = false }, 2000)
  }, [])

  // Start file watcher
  const startWatcher = useCallback(async () => {
    if (inTauri) {
      const path = pathRef.current
      if (!path) return
      // Tauri watcher: typing/visibility pause not needed — events are pushed,
      // not polled, and self-writes are suppressed via selfWritingRef.
      if (unwatchRef.current) { unwatchRef.current(); unwatchRef.current = null }
      setFileState(s => ({ ...s, watcherStatus: 'linked' }))
      try {
        const unwatch = await watch(path, async () => {
          if (selfWritingRef.current) return
          try {
            const meta = await stat(path)
            const mtime = meta.mtime ? meta.mtime.getTime() : 0
            if (mtime === lastModifiedRef.current) return
            lastModifiedRef.current = mtime
            const text = await readTextFile(path)
            if (!isDirty) {
              if (editor) {
                editor.commands.setContent(markdownToHtml(text))
                markSaved()
              }
            } else {
              setConflict({ diskContent: text })
            }
          } catch {
            // file may have been deleted or moved
          }
        }, { recursive: false, delayMs: 200 })
        unwatchRef.current = unwatch
      } catch (e) {
        console.error('Watch failed:', e)
      }
      return
    }

    if (watcherRef.current) clearInterval(watcherRef.current)
    setFileState(s => ({ ...s, watcherStatus: 'linked' }))

    watcherRef.current = setInterval(async () => {
      const handle = handleRef.current
      if (!handle) return

      if (typingRef.current) {
        setFileState(s => s.watcherStatus === 'paused' ? s : { ...s, watcherStatus: 'paused' })
        return
      }
      if (document.hidden) {
        setFileState(s => s.watcherStatus === 'paused' ? s : { ...s, watcherStatus: 'paused' })
        return
      }

      setFileState(s => s.watcherStatus === 'linked' ? s : { ...s, watcherStatus: 'linked' })

      try {
        const file = await handle.getFile()
        if (file.lastModified !== lastModifiedRef.current) {
          lastModifiedRef.current = file.lastModified
          const text = await file.text()

          if (!isDirty) {
            if (editor) {
              const html = markdownToHtml(text)
              editor.commands.setContent(html)
              markSaved()
            }
          } else {
            setConflict({ diskContent: text })
          }
        }
      } catch {
        // File may have been deleted or permissions revoked
      }
    }, 2000)
  }, [editor, isDirty, markSaved])

  const stopWatcher = useCallback(() => {
    if (inTauri) {
      if (unwatchRef.current) {
        unwatchRef.current()
        unwatchRef.current = null
      }
      setFileState(s => ({ ...s, watcherStatus: 'unlinked' }))
      return
    }
    if (watcherRef.current) {
      clearInterval(watcherRef.current)
      watcherRef.current = null
    }
    setFileState(s => ({ ...s, watcherStatus: 'unlinked' }))
  }, [])

  useEffect(() => {
    return () => {
      if (watcherRef.current) clearInterval(watcherRef.current)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (unwatchRef.current) unwatchRef.current()
    }
  }, [])

  // Tauri-only: load a file by absolute path. Used both by the dialog flow
  // (openFile) and by the CLI-arg bootstrap (when launched via "Open with").
  const openPath = useCallback(async (path: string) => {
    if (!editor || !inTauri) return
    try {
      pathRef.current = path
      const text = await readTextFile(path)
      const meta = await stat(path)
      lastModifiedRef.current = meta.mtime ? meta.mtime.getTime() : 0
      editor.commands.setContent(markdownToHtml(text))
      const fileName = basename(path)
      setDocName(fileName.replace(/\.(txt|md|markdown)$/, ''))
      setFileState({ isLinked: true, watcherStatus: 'linked', fileName })
      markSaved()
      await startWatcher()
    } catch (e) {
      console.error('Open path failed:', e)
    }
  }, [editor, markSaved, setDocName, startWatcher])

  // Bootstrap: when launched via OS file association, the file path arrives as
  // argv[1]. Ask Rust for it once the editor is ready, then load if present.
  const bootstrappedRef = useRef(false)
  useEffect(() => {
    if (!inTauri || !editor || bootstrappedRef.current) return
    bootstrappedRef.current = true
    ;(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const path = await invoke<string | null>('get_initial_file_path')
        if (path) await openPath(path)
      } catch (e) {
        console.error('Initial file load failed:', e)
      }
    })()
  }, [editor, openPath])

  const openFile = useCallback(async () => {
    if (!editor) return

    if (inTauri) {
      try {
        const path = await tauriOpen({
          multiple: false,
          filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
        })
        if (!path || typeof path !== 'string') return
        await openPath(path)
      } catch (e) {
        console.error('Open failed:', e)
      }
      return
    }

    if (hasFileSystemAccess) {
      try {
        const [handle] = await (window as unknown as { showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
          types: [{ description: 'Text files', accept: { 'text/plain': ['.txt', '.md'] } }],
        })
        handleRef.current = handle
        const file = await handle.getFile()
        lastModifiedRef.current = file.lastModified
        const text = await file.text()
        const html = markdownToHtml(text)
        editor.commands.setContent(html)
        setDocName(file.name.replace(/\.(txt|md)$/, ''))
        setFileState({ isLinked: true, watcherStatus: 'linked', fileName: file.name })
        markSaved()
        await startWatcher()
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') console.error('Open failed:', e)
      }
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,.md,.markdown'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        const text = await file.text()
        const html = markdownToHtml(text)
        editor.commands.setContent(html)
        setDocName(file.name.replace(/\.(txt|md)$/, ''))
        setFileState({ isLinked: false, watcherStatus: 'unlinked', fileName: file.name })
        markSaved()
      }
      input.click()
    }
  }, [editor, markSaved, setDocName, startWatcher])

  const saveFile = useCallback(async () => {
    if (!editor) return
    const md = editorToMarkdown(editor)

    if (inTauri) {
      const path = pathRef.current
      if (!path) {
        await saveAs()
        return
      }
      try {
        selfWritingRef.current = true
        await writeTextFile(path, md)
        const meta = await stat(path)
        lastModifiedRef.current = meta.mtime ? meta.mtime.getTime() : 0
        markSaved()
      } catch (e) {
        console.error('Save failed:', e)
      } finally {
        selfWritingRef.current = false
      }
      return
    }

    if (handleRef.current) {
      try {
        const writable = await handleRef.current.createWritable()
        await writable.write(md)
        await writable.close()
        const file = await handleRef.current.getFile()
        lastModifiedRef.current = file.lastModified
        markSaved()
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') console.error('Save failed:', e)
      }
    } else {
      await saveAs()
    }
  }, [editor, markSaved])

  const saveAs = useCallback(async () => {
    if (!editor) return
    const md = editorToMarkdown(editor)

    if (inTauri) {
      try {
        const suggestedName = (fileState.fileName || 'document.md')
        const path = await tauriSave({
          defaultPath: suggestedName.match(/\.(md|markdown|txt)$/) ? suggestedName : suggestedName + '.md',
          filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
        })
        if (!path) return
        pathRef.current = path
        try {
          selfWritingRef.current = true
          await writeTextFile(path, md)
          const meta = await stat(path)
          lastModifiedRef.current = meta.mtime ? meta.mtime.getTime() : 0
        } finally {
          selfWritingRef.current = false
        }
        const fileName = basename(path)
        setDocName(fileName.replace(/\.(txt|md|markdown)$/, ''))
        setFileState({ isLinked: true, watcherStatus: 'linked', fileName })
        markSaved()
        await startWatcher()
      } catch (e) {
        console.error('Save As failed:', e)
      }
      return
    }

    if (hasFileSystemAccess) {
      try {
        const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: (fileState.fileName || 'document') + '.md',
          types: [{ description: 'Text files', accept: { 'text/plain': ['.txt', '.md'] } }],
        })
        handleRef.current = handle
        const writable = await handle.createWritable()
        await writable.write(md)
        await writable.close()
        const file = await handle.getFile()
        lastModifiedRef.current = file.lastModified
        setDocName(file.name.replace(/\.(txt|md)$/, ''))
        setFileState({ isLinked: true, watcherStatus: 'linked', fileName: file.name })
        markSaved()
        await startWatcher()
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') console.error('Save As failed:', e)
      }
    } else {
      const blob = new Blob([md], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = (fileState.fileName || 'document') + '.md'
      a.click()
      URL.revokeObjectURL(url)
      markSaved()
    }
  }, [editor, fileState.fileName, markSaved, setDocName, startWatcher])

  const newDocument = useCallback(() => {
    if (!editor) return
    if (isDirty && !window.confirm('Discard unsaved changes?')) return
    editor.commands.clearContent()
    handleRef.current = null
    pathRef.current = null
    lastModifiedRef.current = 0
    stopWatcher()
    setDocName('Untitled Document')
    setFileState({ isLinked: false, watcherStatus: 'unlinked', fileName: '' })
    markSaved()
  }, [editor, isDirty, markSaved, setDocName, stopWatcher])

  const downloadCopy = useCallback(() => {
    if (!editor) return
    const md = editorToMarkdown(editor)
    const blob = new Blob([md], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (fileState.fileName || 'document') + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [editor, fileState.fileName])

  const downloadMarkdown = useCallback(() => {
    if (!editor) return
    const md = editorToMarkdown(editor)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (fileState.fileName || 'document') + '.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [editor, fileState.fileName])

  const revertToSaved = useCallback(async () => {
    if (!editor) return

    if (inTauri) {
      const path = pathRef.current
      if (!path) return
      if (!window.confirm('Discard unsaved changes and reload from disk?')) return
      try {
        const text = await readTextFile(path)
        const meta = await stat(path)
        lastModifiedRef.current = meta.mtime ? meta.mtime.getTime() : 0
        const html = markdownToHtml(text)
        editor.commands.setContent(html)
        markSaved()
      } catch (e) {
        console.error('Revert failed:', e)
      }
      return
    }

    if (!handleRef.current) return
    if (!window.confirm('Discard unsaved changes and reload from disk?')) return
    try {
      const file = await handleRef.current.getFile()
      lastModifiedRef.current = file.lastModified
      const text = await file.text()
      const html = markdownToHtml(text)
      editor.commands.setContent(html)
      markSaved()
    } catch (e) {
      console.error('Revert failed:', e)
    }
  }, [editor, markSaved])

  const unlinkFile = useCallback(() => {
    handleRef.current = null
    pathRef.current = null
    lastModifiedRef.current = 0
    stopWatcher()
    setFileState({ isLinked: false, watcherStatus: 'unlinked', fileName: '' })
  }, [stopWatcher])

  const resolveConflict = useCallback((action: 'reload' | 'keep') => {
    if (action === 'reload' && conflict && editor) {
      const html = markdownToHtml(conflict.diskContent)
      editor.commands.setContent(html)
      markSaved()
    }
    setConflict(null)
  }, [conflict, editor, markSaved])

  return {
    fileState,
    conflict,
    onTyping,
    openFile,
    saveFile,
    saveAs,
    newDocument,
    downloadCopy,
    downloadMarkdown,
    revertToSaved,
    unlinkFile,
    resolveConflict,
  }
}
