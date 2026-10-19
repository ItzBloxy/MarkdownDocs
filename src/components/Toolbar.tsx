import { useState, useRef, useEffect } from 'react'
import { type Editor } from '@tiptap/react'
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough,
  Code, Braces, Link, List, ListOrdered, Quote, Minus,
  Table2, EyeOff, ChevronDown,
} from 'lucide-react'
import '../styles/toolbar.css'

const headingOptions = [
  { key: 'p', label: 'Normal Text' },
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
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
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
    <div
      style={{
        background: 'var(--bg-surface-alt)',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        borderBottom: '1px solid var(--border-primary)',
        flexShrink: 0,
      }}
    >
      {/* Undo / Redo */}
      <button
        className="tb-btn"
        aria-label="Undo"
        disabled={!editor?.can().undo()}
        onClick={() => editor?.chain().focus().undo().run()}
      >
        <Undo2 size={16} />
      </button>
      <button
        className="tb-btn"
        aria-label="Redo"
        disabled={!editor?.can().redo()}
        onClick={() => editor?.chain().focus().redo().run()}
      >
        <Redo2 size={16} />
      </button>
      <div className="tb-sep" />

      {/* Heading dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <div
          className="heading-dropdown"
          aria-label="Text style"
          onClick={() => setHeadingOpen(!headingOpen)}
        >
          <span>{headingOptions.find(h => h.key === activeHeading)?.label ?? 'Normal Text'}</span>
          <ChevronDown size={12} style={{ marginLeft: 8, opacity: 0.6 }} />
        </div>
        {headingOpen && (
          <div className="heading-dropdown-menu">
            {headingOptions.map(opt => (
              <div
                key={opt.key}
                className={`heading-dropdown-item ${opt.key === activeHeading ? 'active' : ''}`}
                onClick={() => setHeading(opt.key)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tb-sep" />

      {/* Inline formatting */}
      <button
        className={`tb-btn ${isActive('bold') ? 'active' : ''}`}
        aria-label="Bold"
        onClick={() => run(() => editor?.chain().focus().toggleBold().run())}
      >
        <Bold size={16} />
      </button>
      <button
        className={`tb-btn ${isActive('italic') ? 'active' : ''}`}
        aria-label="Italic"
        onClick={() => run(() => editor?.chain().focus().toggleItalic().run())}
      >
        <Italic size={16} />
      </button>
      <button
        className={`tb-btn ${isActive('underline') ? 'active' : ''}`}
        aria-label="Underline"
        onClick={() => run(() => editor?.chain().focus().toggleMark('underline').run())}
      >
        <Underline size={16} />
      </button>
      <button
        className={`tb-btn ${isActive('strike') ? 'active' : ''}`}
        aria-label="Strikethrough"
        onClick={() => run(() => editor?.chain().focus().toggleStrike().run())}
      >
        <Strikethrough size={16} />
      </button>
      <div className="tb-sep" />

      {/* Code, Code Block, Link */}
      <button
        className={`tb-btn ${isActive('code') ? 'active' : ''}`}
        aria-label="Inline code"
        onClick={() => run(() => editor?.chain().focus().toggleCode().run())}
      >
        <Code size={16} />
      </button>
      <button
        className={`tb-btn ${isActive('codeBlock') ? 'active' : ''}`}
        aria-label="Code block"
        onClick={() => run(() => editor?.chain().focus().toggleCodeBlock().run())}
      >
        <Braces size={16} />
      </button>
      <button
        className={`tb-btn ${isActive('link') ? 'active' : ''}`}
        aria-label="Link"
        onClick={onLinkClick}
      >
        <Link size={16} />
      </button>
      <div className="tb-sep" />

      {/* Lists, Quote, HR */}
      <button
        className={`tb-btn ${isActive('bulletList') ? 'active' : ''}`}
        aria-label="Bullet list"
        onClick={() => run(() => editor?.chain().focus().toggleBulletList().run())}
      >
        <List size={16} />
      </button>
      <button
        className={`tb-btn ${isActive('orderedList') ? 'active' : ''}`}
        aria-label="Numbered list"
        onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run())}
      >
        <ListOrdered size={16} />
      </button>
      <button
        className={`tb-btn ${isActive('blockquote') ? 'active' : ''}`}
        aria-label="Blockquote"
        onClick={() => run(() => editor?.chain().focus().toggleBlockquote().run())}
      >
        <Quote size={16} />
      </button>
      <button
        className="tb-btn"
        aria-label="Horizontal rule"
        onClick={() => run(() => editor?.chain().focus().setHorizontalRule().run())}
      >
        <Minus size={16} />
      </button>
      <div className="tb-sep" />

      {/* Table, Spoiler */}
      <button
        className="tb-btn"
        aria-label="Table"
        onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run()}
      >
        <Table2 size={16} />
      </button>
      <button
        className={`tb-btn ${isActive('spoiler') ? 'active' : ''}`}
        aria-label="Spoiler"
        onClick={() => run(() => editor?.chain().focus().toggleMark('spoiler').run())}
      >
        <EyeOff size={16} />
      </button>

      <div style={{ flex: 1 }} />

      {/* Preview */}
      <button className="preview-btn" aria-label="Toggle preview" disabled>
        Preview
      </button>
    </div>
  )
}
