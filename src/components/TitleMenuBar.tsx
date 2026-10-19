import { useState, useRef, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { DocIdentity } from './DocIdentity'
import { MenuDropdown, type MenuItem } from './MenuDropdown'
import { showToast } from './Toast'
import { editorToMarkdown } from '../utils/markdownExport'
import { openImagePopover } from '../utils/imagePopover'
import { ACCENT_PRESETS } from '../utils/accent'
import { useTheme } from '../context/theme'

interface FileSystemActions {
  openFile: () => void
  saveFile: () => void
  saveAs: () => void
  newDocument: () => void
  downloadCopy: () => void
  downloadMarkdown: () => void
  revertToSaved: () => void
  unlinkFile: () => void
  fileState: { isLinked: boolean }
}

interface TitleMenuBarProps {
  editor: Editor | null
  onOpenShortcuts: () => void
  onLinkClick?: () => void
  onOpenFind?: () => void
  fileSystem?: FileSystemActions
}

const SEP: MenuItem = { label: '', separator: true }

export function TitleMenuBar({ editor, onOpenShortcuts, onLinkClick, onOpenFind, fileSystem: fs }: TitleMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const { mode, accent, setMode, setAccent } = useTheme()
  // Held in state (callback ref) so the menu action can reach it without reading a ref during render
  const [colorInput, setColorInput] = useState<HTMLInputElement | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpenMenu(null), [])

  useEffect(() => {
    if (!openMenu) return
    const handleClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu, close])

  const toggle = (name: string) => {
    setOpenMenu(prev => prev === name ? null : name)
  }

  const fileItems: MenuItem[] = [
    { label: 'New', shortcut: 'Ctrl+N', action: fs?.newDocument },
    { label: 'Open...', shortcut: 'Ctrl+O', action: fs?.openFile },
    SEP,
    { label: 'Save', shortcut: 'Ctrl+S', action: fs?.saveFile },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: fs?.saveAs },
    { label: 'Download copy', action: fs?.downloadCopy },
    { label: 'Download as .md', action: fs?.downloadMarkdown },
    SEP,
    { label: 'Revert to saved', shortcut: 'Ctrl+Shift+R', action: fs?.revertToSaved, disabled: !fs?.fileState.isLinked },
    { label: 'Unlink file', action: fs?.unlinkFile, disabled: !fs?.fileState.isLinked },
  ]

  const editItems: MenuItem[] = [
    { label: 'Undo', shortcut: 'Ctrl+Z', action: () => editor?.chain().focus().undo().run() },
    { label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => editor?.chain().focus().redo().run() },
    SEP,
    { label: 'Find & Replace', shortcut: 'Ctrl+F', action: onOpenFind },
  ]

  const insertItems: MenuItem[] = [
    { label: 'Heading 1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    SEP,
    { label: 'Bullet List', shortcut: 'Ctrl+Shift+8', action: () => editor?.chain().focus().toggleBulletList().run() },
    { label: 'Numbered List', shortcut: 'Ctrl+Shift+7', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: 'Blockquote', shortcut: 'Ctrl+Shift+9', action: () => editor?.chain().focus().toggleBlockquote().run() },
    { label: 'Code Block', action: () => editor?.chain().focus().toggleCodeBlock().run() },
    { label: 'Horizontal Rule', action: () => editor?.chain().focus().setHorizontalRule().run() },
    SEP,
    { label: 'Image...', action: openImagePopover },
    { label: 'Table', action: () => editor?.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run() },
  ]

  const formatItems: MenuItem[] = [
    { label: 'Bold', shortcut: 'Ctrl+B', action: () => editor?.chain().focus().toggleBold().run() },
    { label: 'Italic', shortcut: 'Ctrl+I', action: () => editor?.chain().focus().toggleItalic().run() },
    { label: 'Underline', shortcut: 'Ctrl+U', action: () => editor?.chain().focus().toggleMark('underline').run() },
    { label: 'Strikethrough', shortcut: 'Ctrl+Shift+X', action: () => editor?.chain().focus().toggleStrike().run() },
    { label: 'Inline Code', shortcut: 'Ctrl+E', action: () => editor?.chain().focus().toggleCode().run() },
    SEP,
    { label: 'Link...', shortcut: 'Ctrl+K', action: onLinkClick },
    { label: 'Spoiler', action: () => editor?.chain().focus().toggleMark('spoiler').run() },
  ]

  const isPresetAccent = ACCENT_PRESETS.some(p => p.hex === accent)
  const openColorPicker = () => {
    if (!colorInput) return
    try { colorInput.showPicker() } catch { colorInput.click() }
  }

  const themeItems: MenuItem[] = [
    { label: 'Mode', header: true },
    { label: 'Dark', checked: mode === 'dark', action: () => setMode('dark') },
    { label: 'Light', checked: mode === 'light', action: () => setMode('light') },
    { label: 'Match system', checked: mode === 'system', action: () => setMode('system') },
    SEP,
    { label: 'Accent', header: true },
    ...ACCENT_PRESETS.map(p => ({ label: p.name, swatch: p.hex, checked: accent === p.hex, action: () => setAccent(p.hex) })),
    {
      label: 'Custom color...',
      swatch: isPresetAccent ? '' : accent,
      checked: !isPresetAccent,
      shortcut: isPresetAccent ? undefined : accent,
      action: openColorPicker,
    },
  ]

  const helpItems: MenuItem[] = [
    { label: 'Keyboard Shortcuts', action: onOpenShortcuts },
  ]

  const menus = [
    { label: 'File', items: fileItems },
    { label: 'Edit', items: editItems },
    { label: 'Insert', items: insertItems },
    { label: 'Format', items: formatItems },
    { label: 'Themes', items: themeItems },
    { label: 'Help', items: helpItems },
  ]

  const copyMarkdown = async () => {
    if (!editor) return
    try {
      await navigator.clipboard.writeText(editorToMarkdown(editor))
      showToast('Markdown copied to clipboard')
    } catch {
      showToast("Couldn't reach the clipboard. Use File › Download as .md instead.")
    }
  }

  return (
    <div ref={barRef} className="title-bar">
      <DocIdentity />
      <nav className="menubar" aria-label="Application menu">
        {menus.map(menu => (
          <div key={menu.label} className="menubar-slot">
            <button
              type="button"
              className={`menubar-trigger ${openMenu === menu.label ? 'is-open' : ''}`}
              aria-haspopup="menu"
              aria-expanded={openMenu === menu.label}
              onClick={() => toggle(menu.label)}
              onMouseEnter={() => {
                if (openMenu && openMenu !== menu.label) setOpenMenu(menu.label)
              }}
            >
              {menu.label}
            </button>
            {openMenu === menu.label && (
              <MenuDropdown items={menu.items} onClose={close} />
            )}
            {menu.label === 'Themes' && (
              // Outlives the menu so the native picker stays open; updates live while dragging
              <input
                ref={setColorInput}
                type="color"
                className="theme-color-input"
                value={accent}
                onChange={e => setAccent(e.target.value)}
                tabIndex={-1}
                aria-label="Custom accent color"
              />
            )}
          </div>
        ))}
      </nav>
      <div className="title-bar-actions">
        <button
          type="button"
          className="menubar-trigger"
          aria-label="Copy document as markdown"
          onClick={copyMarkdown}
          disabled={!editor}
        >
          Share
        </button>
      </div>
    </div>
  )
}
