import { useState, useRef, useEffect, type ReactNode } from 'react'
import { type Editor } from '@tiptap/react'
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough,
  Code, Braces, Link, List, ListOrdered, Quote, Minus,
  Table2, EyeOff, ChevronDown,
} from 'lucide-react'

const headingOptions = [
  { key: 'p', label: 'Normal text' },
  { key: 'h1', label: 'Heading 1' },
  { key: 'h2', label: 'Heading 2' },
  { key: 'h3', label: 'Heading 3' },
] as const

function getActiveHeading(editor: Editor | null): string {
  if (!editor) return 'p'
  if (editor.isActive('heading', { level: 1 })) return 'h1'
  if (editor.isActive('heading', { level: 2 })) return 'h2'
  if (editor.isActive('heading', { level: 3 })) return 'h3'
  return 'p'
}

const ICON = 18

interface ToolButtonProps {
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolButton({ label, shortcut, active, disabled, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      className={`tb-btn has-tip ${active ? 'is-active' : ''}`}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      data-tip={shortcut ? `${label}  ${shortcut}` : label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface ToolbarProps {
  editor: Editor | null
  onLinkClick?: () => void
}

export function Toolbar({ editor, onLinkClick }: ToolbarProps) {
  const [headingOpen, setHeadingOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const activeHeading = getActiveHeading(editor)

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(name, attrs) ?? false

  const run = (cmd: () => boolean | undefined) => {
    cmd()
    setHeadingOpen(false)
  }

  useEffect(() => {
    if (!headingOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setHeadingOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHeadingOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [headingOpen])

  const setHeading = (key: string) => {
    if (!editor) return
    if (key === 'p') {
      editor.chain().focus().setParagraph().run()
    } else {
      const level = parseInt(key[1]) as 1 | 2 | 3
      editor.chain().focus().toggleHeading({ level }).run()
    }
    setHeadingOpen(false)
  }

  return (
    <div className="toolbar-bar" role="toolbar" aria-label="Formatting">
      <ToolButton label="Undo" shortcut="Ctrl+Z" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
        <Undo2 size={ICON} />
      </ToolButton>
      <ToolButton label="Redo" shortcut="Ctrl+Shift+Z" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
        <Redo2 size={ICON} />
      </ToolButton>
      <div className="tb-sep" />

      <div ref={dropdownRef} className="style-picker">
        <button
          type="button"
          className={`style-select ${headingOpen ? 'is-open' : ''}`}
          aria-label="Text style"
          aria-haspopup="menu"
          aria-expanded={headingOpen}
          onClick={() => setHeadingOpen(!headingOpen)}
        >
          <span>{headingOptions.find(h => h.key === activeHeading)?.label ?? 'Normal text'}</span>
          <ChevronDown size={16} />
        </button>
        {headingOpen && (
          <div className="menu" role="menu">
            {headingOptions.map(opt => (
              <button
                key={opt.key}
                type="button"
                role="menuitemradio"
                aria-checked={opt.key === activeHeading}
                className="menu-item"
                onClick={() => setHeading(opt.key)}
              >
                <span className={`menu-check ${opt.key === activeHeading ? 'is-on' : ''}`} aria-hidden="true" />
                <span className={`menu-item-label style-option-${opt.key}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="tb-sep" />

      <ToolButton label="Bold" shortcut="Ctrl+B" active={isActive('bold')} onClick={() => run(() => editor?.chain().focus().toggleBold().run())}>
        <Bold size={ICON} />
      </ToolButton>
      <ToolButton label="Italic" shortcut="Ctrl+I" active={isActive('italic')} onClick={() => run(() => editor?.chain().focus().toggleItalic().run())}>
        <Italic size={ICON} />
      </ToolButton>
      <ToolButton label="Underline" shortcut="Ctrl+U" active={isActive('underline')} onClick={() => run(() => editor?.chain().focus().toggleMark('underline').run())}>
        <Underline size={ICON} />
      </ToolButton>
      <ToolButton label="Strikethrough" shortcut="Ctrl+Shift+X" active={isActive('strike')} onClick={() => run(() => editor?.chain().focus().toggleStrike().run())}>
        <Strikethrough size={ICON} />
      </ToolButton>
      <div className="tb-sep" />

      <ToolButton label="Inline code" shortcut="Ctrl+E" active={isActive('code')} onClick={() => run(() => editor?.chain().focus().toggleCode().run())}>
        <Code size={ICON} />
      </ToolButton>
      <ToolButton label="Code block" active={isActive('codeBlock')} onClick={() => run(() => editor?.chain().focus().toggleCodeBlock().run())}>
        <Braces size={ICON} />
      </ToolButton>
      <ToolButton label="Link" shortcut="Ctrl+K" active={isActive('link')} onClick={() => onLinkClick?.()}>
        <Link size={ICON} />
      </ToolButton>
      <div className="tb-sep" />

      <ToolButton label="Bullet list" shortcut="Ctrl+Shift+8" active={isActive('bulletList')} onClick={() => run(() => editor?.chain().focus().toggleBulletList().run())}>
        <List size={ICON} />
      </ToolButton>
      <ToolButton label="Numbered list" shortcut="Ctrl+Shift+7" active={isActive('orderedList')} onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run())}>
        <ListOrdered size={ICON} />
      </ToolButton>
      <ToolButton label="Blockquote" shortcut="Ctrl+Shift+9" active={isActive('blockquote')} onClick={() => run(() => editor?.chain().focus().toggleBlockquote().run())}>
        <Quote size={ICON} />
      </ToolButton>
      <ToolButton label="Horizontal rule" onClick={() => run(() => editor?.chain().focus().setHorizontalRule().run())}>
        <Minus size={ICON} />
      </ToolButton>
      <div className="tb-sep" />

      <ToolButton label="Table" onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run()}>
        <Table2 size={ICON} />
      </ToolButton>
      <ToolButton label="Spoiler" active={isActive('spoiler')} onClick={() => run(() => editor?.chain().focus().toggleMark('spoiler').run())}>
        <EyeOff size={ICON} />
      </ToolButton>

    </div>
  )
}
