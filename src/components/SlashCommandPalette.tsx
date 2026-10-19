import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Pilcrow, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Braces, Table2, Minus,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { onSlashCommandState, type SlashCommandState } from '../extensions/SlashCommands'

interface SlashCommand {
  label: string
  description: string
  icon: React.ReactNode
  aliases: string[]
  disabled?: boolean
  action: (editor: Editor) => void
}

const commands: SlashCommand[] = [
  {
    label: 'Text', description: 'Plain paragraph', icon: <Pilcrow size={16} />,
    aliases: ['text', 'paragraph', 'p'],
    action: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    label: 'Heading 1', description: 'Large heading', icon: <Heading1 size={16} />,
    aliases: ['h1', 'heading1', 'heading 1'],
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2', description: 'Medium heading', icon: <Heading2 size={16} />,
    aliases: ['h2', 'heading2', 'heading 2'],
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3', description: 'Small heading', icon: <Heading3 size={16} />,
    aliases: ['h3', 'heading3', 'heading 3'],
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Bullet List', description: 'Unordered list item', icon: <List size={16} />,
    aliases: ['bullet', 'list', 'ul'],
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Numbered List', description: 'Ordered list item', icon: <ListOrdered size={16} />,
    aliases: ['numbered', 'ordered', 'ol'],
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Quote', description: 'Blockquote', icon: <Quote size={16} />,
    aliases: ['quote', 'blockquote'],
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: 'Code Block', description: 'Fenced code block', icon: <Braces size={16} />,
    aliases: ['code', 'codeblock', 'block'],
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: 'Table', description: 'Insert a table', icon: <Table2 size={16} />,
    aliases: ['table'],
    action: (e) => e.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run(),
  },
  {
    label: 'Divider', description: 'Horizontal rule', icon: <Minus size={16} />,
    aliases: ['divider', 'hr', 'rule', 'line'],
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
]

function filterCommands(query: string): SlashCommand[] {
  const q = query.toLowerCase()
  if (!q) return commands
  return commands.filter(cmd =>
    cmd.label.toLowerCase().includes(q) ||
    cmd.aliases.some(a => a.includes(q))
  )
}

interface SlashCommandPaletteProps {
  editor: Editor | null
}

export function SlashCommandPalette({ editor }: SlashCommandPaletteProps) {
  const [state, setState] = useState<SlashCommandState>({
    active: false, query: '', clientRect: null, command: null,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const items = filterCommands(state.query)

  useEffect(() => {
    return onSlashCommandState(setState)
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [state.query])

  const selectItem = useCallback((index: number) => {
    const item = items[index]
    if (!item || item.disabled || !editor) return
    item.action(editor)
    setState(s => ({ ...s, active: false }))
  }, [items, editor])

  // Listen for keyboard events from the suggestion plugin
  useEffect(() => {
    if (!state.active) return
    const handler = (e: Event) => {
      const key = (e as CustomEvent).detail.key
      if (key === 'ArrowUp') {
        setSelectedIndex(i => (i - 1 + items.length) % items.length)
      } else if (key === 'ArrowDown') {
        setSelectedIndex(i => (i + 1) % items.length)
      } else if (key === 'Enter') {
        selectItem(selectedIndex)
      }
    }
    document.addEventListener('slash-keydown', handler)
    return () => document.removeEventListener('slash-keydown', handler)
  }, [state.active, items.length, selectedIndex, selectItem])

  // Position the palette
  useEffect(() => {
    if (!state.active || !state.clientRect || !ref.current) return
    const rect = state.clientRect()
    ref.current.style.top = `${rect.bottom + 4}px`
    ref.current.style.left = `${rect.left}px`
  }, [state.active, state.clientRect, state.query])

  // Scroll selected into view
  useEffect(() => {
    const selected = ref.current?.querySelector('.slash-item.is-highlighted')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!state.active) return null

  return (
    <div ref={ref} className="menu slash-palette" role="listbox" aria-label="Insert block">
      <span className="meta menu-label">Insert block</span>
      {items.length === 0 ? (
        <div className="slash-empty">No blocks match “{state.query}”</div>
      ) : (
        items.map((item, i) => (
          <div
            key={item.label}
            role="option"
            aria-selected={i === selectedIndex}
            className={`menu-item slash-item ${i === selectedIndex ? 'is-highlighted' : ''} ${item.disabled ? 'is-disabled' : ''}`}
            onMouseDown={e => e.preventDefault()}
            onClick={() => selectItem(i)}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <div className="slash-icon">{item.icon}</div>
            <div className="slash-text">
              <span className="slash-label">{item.label}</span>
              <span className="slash-desc">{item.description}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
