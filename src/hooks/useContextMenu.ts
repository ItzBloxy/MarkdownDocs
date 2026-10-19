import { useState, useCallback, useEffect } from 'react'

export type ContextType =
  | 'link' | 'inline-code' | 'spoiler' | 'table-cell'
  | 'code-block' | 'hr' | 'selection' | 'block' | 'canvas'

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  context: ContextType
  targetEl: HTMLElement | null
}

function detectContext(target: HTMLElement): ContextType {
  let el: HTMLElement | null = target

  while (el && !el.classList?.contains('tiptap')) {
    // Link
    if (el.tagName === 'A') return 'link'
    // Inline code (not inside a pre/code block)
    if (el.tagName === 'CODE' && el.closest('pre') === null) return 'inline-code'
    // Spoiler
    if (el.classList?.contains('spoiler')) return 'spoiler'
    // Table cell
    if (el.tagName === 'TH' || el.tagName === 'TD') return 'table-cell'
    // Code block
    if (el.tagName === 'PRE') return 'code-block'
    // Horizontal rule
    if (el.tagName === 'HR') return 'hr'

    el = el.parentElement
  }

  // Selection check
  const sel = window.getSelection()
  if (sel && !sel.isCollapsed) return 'selection'

  // Inside editor content
  if (target.closest('.tiptap')) return 'block'

  // Canvas outside content
  return 'canvas'
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, context: 'block', targetEl: null,
  })

  const close = useCallback(() => {
    setMenu(s => s.visible ? { ...s, visible: false } : s)
  }, [])

  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Only intercept on editor canvas area
    const target = e.target as HTMLElement
    if (!target.closest('.editor-canvas')) return

    e.preventDefault()
    const context = detectContext(target)
    setMenu({ visible: true, x: e.clientX, y: e.clientY, context, targetEl: target })
  }, [])

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [handleContextMenu])

  // Close on outside click, escape, scroll
  useEffect(() => {
    if (!menu.visible) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.context-menu')) close()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleScroll = () => close()

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [menu.visible, close])

  return { menu, close }
}
