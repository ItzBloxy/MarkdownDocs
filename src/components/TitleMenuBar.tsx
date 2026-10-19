import { useState, useRef, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { DocIdentity } from './DocIdentity'
import { MenuDropdown, type MenuItem } from './MenuDropdown'
import '../styles/toolbar.css'

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

type SpellcheckLanguage = 'en_US' | 'da_DK' | 'none'

interface TitleMenuBarProps {
  editor: Editor | null
  onOpenShortcuts: () => void
  onLinkClick?: () => void
  onOpenFind?: () => void
  fileSystem?: FileSystemActions
  spellcheckLanguage?: SpellcheckLanguage
  onSetLanguage?: (lang: SpellcheckLanguage) => void
}

const SEP: MenuItem = { label: '', separator: true }

export function TitleMenuBar({ editor, onOpenShortcuts, onLinkClick, onOpenFind, fileSystem: fs, spellcheckLanguage, onSetLanguage }: TitleMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
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

  const languageItems: MenuItem[] = [
    { label: spellcheckLanguage === 'en_US' ? '✓ English (US)' : '  English (US)', action: () => onSetLanguage?.('en_US') },
    { label: spellcheckLanguage === 'da_DK' ? '✓ Dansk (DA)' : '  Dansk (DA)', action: () => onSetLanguage?.('da_DK') },
    { label: spellcheckLanguage === 'none' ? '✓ None' : '  None', action: () => onSetLanguage?.('none') },
  ]

  const helpItems: MenuItem[] = [
    { label: 'Keyboard Shortcuts', action: onOpenShortcuts },
  ]

  const menus = [
    { label: 'File', items: fileItems },
    { label: 'Edit', items: editItems },
    { label: 'Insert', items: insertItems },
    { label: 'Format', items: formatItems },
    { label: 'Language', items: languageItems },
    { label: 'Help', items: helpItems },
  ]

  return (
    <div
      ref={barRef}
      style={{
        background: 'var(--bg-surface)',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--border-primary)',
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      <DocIdentity />
      <div style={{ display: 'flex', gap: 4 }}>
        {menus.map(menu => (
          <div key={menu.label} style={{ position: 'relative' }}>
            <span
              className="menu-item"
              onClick={() => toggle(menu.label)}
              onMouseEnter={() => {
                if (openMenu && openMenu !== menu.label) setOpenMenu(menu.label)
              }}
            >
              {menu.label}
            </span>
            {openMenu === menu.label && (
              <MenuDropdown items={menu.items} onClose={close} />
            )}
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button
        className="menu-item"
        style={{ border: 'none', background: 'none', fontFamily: 'var(--font-ui)' }}
        aria-label="Copy document as markdown"
      >
        Share
      </button>
    </div>
  )
}
