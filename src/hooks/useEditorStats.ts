import { useState, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'

interface EditorStats {
  wordCount: number
  charCount: number
  lineCount: number
  pageCount: number
}

export function useEditorStats(editor: Editor | null): EditorStats {
  const [stats, setStats] = useState<EditorStats>({
    wordCount: 0,
    charCount: 0,
    lineCount: 1,
    pageCount: 1,
  })

  const calculateStats = useCallback(() => {
    if (!editor) return

    const text = editor.state.doc.textContent
    const words = text.split(/\s+/).filter(Boolean)
    const topLevelNodes = editor.state.doc.childCount

    setStats({
      wordCount: words.length,
      charCount: text.length,
      lineCount: Math.max(topLevelNodes, 1),
      pageCount: 1, // Simple for now — Phase 4 adds real pagination
    })
  }, [editor])

  useEffect(() => {
    if (!editor) return

    // Calculate on mount
    calculateStats()

    // Subscribe to updates
    editor.on('update', calculateStats)
    return () => {
      editor.off('update', calculateStats)
    }
  }, [editor, calculateStats])

  return stats
}
