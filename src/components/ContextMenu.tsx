import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import {
  Scissors, Copy, Clipboard, Bold, Italic, Underline, Strikethrough,
  Code, Sparkles, Link2, Search, Type, Pilcrow, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Braces, ExternalLink, Unlink, Eye, EyeOff,
  Hash, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, Trash2,
  ChevronRight, Plus, Check,
} from 'lucide-react'
import type { ContextType } from '../hooks/useContextMenu'
import type { useSpellcheck } from '../hooks/useSpellcheck'
import '../styles/context-menu.css'

interface ContextMenuProps {
  x: number
  y: number
  context: ContextType
  targetEl: HTMLElement | null
  editor: Editor
  onClose: () => void
  spellcheck?: ReturnType<typeof useSpellcheck>
}

interface MenuItem {
  icon?: React.ReactNode
  label: string
  shortcut?: string
  action?: () => void
  disabled?: boolean
  divider?: boolean
  className?: string
  active?: boolean
  sub?: string // sub-menu key
}

const ICON_SIZE = 15

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
  { label: 'Bash', value: 'bash' },
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go' },
  { label: 'SQL', value: 'sql' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Plain Text', value: '' },
]

function TurnIntoSubMenu({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const items = [
    { icon: <Pilcrow size={ICON_SIZE} />, label: 'Text', action: () => editor.chain().focus().setParagraph().run() },
    { icon: <Heading1 size={ICON_SIZE} />, label: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: <Heading2 size={ICON_SIZE} />, label: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: <Heading3 size={ICON_SIZE} />, label: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: <List size={ICON_SIZE} />, label: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run() },
    { icon: <ListOrdered size={ICON_SIZE} />, label: 'Numbered List', action: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: <Quote size={ICON_SIZE} />, label: 'Blockquote', action: () => editor.chain().focus().toggleBlockquote().run() },
    { icon: <Braces size={ICON_SIZE} />, label: 'Code Block', action: () => editor.chain().focus().toggleCodeBlock().run() },
  ]

  return (
    <div className="ctx-submenu">
      {items.map(item => (
        <button key={item.label} className="ctx-item" onClick={() => { item.action(); onClose() }}>
          <span className="ctx-icon">{item.icon}</span>
          <span className="ctx-label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

function LanguageSubMenu({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [filter, setFilter] = useState('')
  const currentLang = editor.getAttributes('codeBlock')?.language ?? ''
  const filtered = LANGUAGES.filter(l => l.label.toLowerCase().includes(filter.toLowerCase()))

  const setLang = (lang: string) => {
    editor.chain().focus().updateAttributes('codeBlock', { language: lang }).run()
    onClose()
  }

  return (
    <div className="ctx-submenu">
      <input
        className="ctx-lang-input"
        placeholder="Type a language..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { setLang(filter.trim()); } }}
        autoFocus
      />
      {filtered.map(lang => (
        <button key={lang.label} className={`ctx-item ${currentLang === lang.value ? 'active' : ''}`} onClick={() => setLang(lang.value)}>
          <span className="ctx-icon">
            {currentLang === lang.value ? <Check size={ICON_SIZE} /> : <Hash size={ICON_SIZE} />}
          </span>
          <span className="ctx-label">{lang.label}</span>
        </button>
      ))}
    </div>
  )
}

export function ContextMenu({ x, y, context, targetEl, editor, onClose, spellcheck }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [openSub, setOpenSub] = useState<string | null>(null)
  const subTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Viewport clamping
  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let nx = x, ny = y
    if (x + rect.width > vw) nx = x - rect.width
    if (y + rect.height > vh) ny = y - rect.height
    if (nx < 0) nx = 4
    if (ny < 0) ny = 4

    ref.current.style.left = `${nx}px`
    ref.current.style.top = `${ny}px`
  }, [x, y])

  const act = (fn: () => void) => {
    fn()
    onClose()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      editor.chain().focus().insertContent(text).run()
    } catch {
      document.execCommand('paste')
    }
  }

  // Build items based on context
  const items: MenuItem[] = []

  // Spellcheck suggestions — prepend if right-clicked a misspelled word
  if (spellcheck) {
    // Find cursor position from click coordinates
    const pos = editor.view.posAtCoords({ left: x, top: y })
    if (pos) {
      const misspelled = spellcheck.getMisspelledAt(pos.pos)
      if (misspelled) {
        const suggestions = spellcheck.getSuggestions(misspelled.word)
        if (suggestions.length > 0) {
          for (const suggestion of suggestions) {
            items.push({
              label: suggestion,
              action: () => spellcheck.replaceWord(misspelled.from, misspelled.to, suggestion),
              className: 'suggestion',
            } as MenuItem)
          }
        } else {
          items.push({ label: 'No suggestions', disabled: true } as MenuItem)
        }
        items.push({ divider: true, label: '' })
        items.push({
          label: 'Add to Dictionary',
          action: () => spellcheck.addToDictionary(misspelled.word),
        })
        items.push({
          label: 'Ignore All',
          action: () => spellcheck.ignoreAll(misspelled.word),
        })
        items.push({ divider: true, label: '' })
      }
    }
  }

  const isActive = (name: string) => editor.isActive(name)

  const selectionItems: MenuItem[] = [
    { icon: <Scissors size={ICON_SIZE} />, label: 'Cut', shortcut: 'Ctrl+X', action: () => { const t = window.getSelection()?.toString() ?? ''; copyToClipboard(t); editor.commands.deleteSelection() } },
    { icon: <Copy size={ICON_SIZE} />, label: 'Copy', shortcut: 'Ctrl+C', action: () => { const t = window.getSelection()?.toString() ?? ''; copyToClipboard(t) } },
    { icon: <Clipboard size={ICON_SIZE} />, label: 'Paste', shortcut: 'Ctrl+V', action: pasteFromClipboard },
    { divider: true, label: '' },
    { icon: isActive('bold') ? <Check size={ICON_SIZE} /> : <Bold size={ICON_SIZE} />, label: 'Bold', shortcut: 'Ctrl+B', action: () => editor.chain().focus().toggleBold().run(), active: isActive('bold') },
    { icon: isActive('italic') ? <Check size={ICON_SIZE} /> : <Italic size={ICON_SIZE} />, label: 'Italic', shortcut: 'Ctrl+I', action: () => editor.chain().focus().toggleItalic().run(), active: isActive('italic') },
    { icon: isActive('underline') ? <Check size={ICON_SIZE} /> : <Underline size={ICON_SIZE} />, label: 'Underline', shortcut: 'Ctrl+U', action: () => editor.chain().focus().toggleMark('underline').run(), active: isActive('underline') },
    { icon: isActive('strike') ? <Check size={ICON_SIZE} /> : <Strikethrough size={ICON_SIZE} />, label: 'Strikethrough', shortcut: 'Ctrl+Shift+X', action: () => editor.chain().focus().toggleStrike().run(), active: isActive('strike') },
    { icon: isActive('code') ? <Check size={ICON_SIZE} /> : <Code size={ICON_SIZE} />, label: 'Inline Code', shortcut: 'Ctrl+E', action: () => editor.chain().focus().toggleCode().run(), active: isActive('code') },
    { icon: <Sparkles size={ICON_SIZE} />, label: 'Spoiler', action: () => editor.chain().focus().toggleMark('spoiler').run() },
    { divider: true, label: '' },
    { icon: <Link2 size={ICON_SIZE} />, label: 'Create Link', shortcut: 'Ctrl+K', action: () => { const url = prompt('URL:'); if (url) editor.chain().focus().setLink({ href: url }).run() } },
    { divider: true, label: '' },
    { icon: <Search size={ICON_SIZE} />, label: 'Look Up Selection', action: () => { const t = window.getSelection()?.toString() ?? ''; if (t) window.open(`https://www.google.com/search?q=${encodeURIComponent(t)}`, '_blank') } },
  ]

  const blockItems: MenuItem[] = [
    { icon: <Copy size={ICON_SIZE} />, label: 'Copy', shortcut: 'Ctrl+C', action: () => { const t = window.getSelection()?.toString() ?? ''; copyToClipboard(t) } },
    { icon: <Clipboard size={ICON_SIZE} />, label: 'Paste', shortcut: 'Ctrl+V', action: pasteFromClipboard },
    { divider: true, label: '' },
    { icon: <Type size={ICON_SIZE} />, label: 'Turn into', sub: 'turnInto' },
  ]

  switch (context) {
    case 'selection':
      items.push(...selectionItems)
      break

    case 'block':
      items.push(...blockItems)
      break

    case 'link': {
      const href = (targetEl?.closest('a') as HTMLAnchorElement)?.href ?? ''
      items.push(
        { icon: <ExternalLink size={ICON_SIZE} />, label: 'Open Link', action: () => window.open(href, '_blank') },
        { icon: <Copy size={ICON_SIZE} />, label: 'Copy Link URL', action: () => copyToClipboard(href) },
        { icon: <Link2 size={ICON_SIZE} />, label: 'Edit Link', action: () => { const url = prompt('URL:', href); if (url) editor.chain().focus().setLink({ href: url }).run() } },
        { icon: <Unlink size={ICON_SIZE} />, label: 'Remove Link', action: () => editor.chain().focus().unsetLink().run() },
        { divider: true, label: '' },
        ...blockItems,
      )
      break
    }

    case 'inline-code':
      items.push(
        { icon: <Copy size={ICON_SIZE} />, label: 'Copy Code', action: () => { const code = targetEl?.closest('code')?.textContent ?? ''; copyToClipboard(code) } },
        { icon: <Code size={ICON_SIZE} />, label: 'Remove Formatting', action: () => editor.chain().focus().unsetMark('code').run() },
        { divider: true, label: '' },
        ...blockItems,
      )
      break

    case 'spoiler': {
      const spoilerEl = targetEl?.closest('.spoiler') as HTMLElement | null
      const isRevealed = spoilerEl?.classList.contains('revealed')
      items.push(
        isRevealed
          ? { icon: <EyeOff size={ICON_SIZE} />, label: 'Re-hide Spoiler', action: () => spoilerEl?.classList.remove('revealed') }
          : { icon: <Eye size={ICON_SIZE} />, label: 'Reveal Spoiler', action: () => spoilerEl?.classList.add('revealed') },
        { icon: <Sparkles size={ICON_SIZE} />, label: 'Remove Spoiler', action: () => editor.chain().focus().unsetMark('spoiler').run() },
        { divider: true, label: '' },
        ...blockItems,
      )
      break
    }

    case 'code-block':
      items.push(
        { icon: <Copy size={ICON_SIZE} />, label: 'Copy All Code', action: () => { const pre = targetEl?.closest('pre'); copyToClipboard(pre?.textContent ?? '') } },
        { icon: <Clipboard size={ICON_SIZE} />, label: 'Paste', action: pasteFromClipboard },
        { divider: true, label: '' },
        { icon: <Hash size={ICON_SIZE} />, label: 'Change Language', sub: 'language' },
      )
      break

    case 'table-cell':
      items.push(
        { icon: <Copy size={ICON_SIZE} />, label: 'Copy', action: () => { const t = window.getSelection()?.toString() ?? ''; copyToClipboard(t) } },
        { icon: <Clipboard size={ICON_SIZE} />, label: 'Paste', action: pasteFromClipboard },
        { divider: true, label: '' },
        { icon: <ArrowRight size={ICON_SIZE} />, label: 'Insert Column Right', action: () => editor.chain().focus().addColumnAfter().run() },
        { icon: <ArrowLeft size={ICON_SIZE} />, label: 'Insert Column Left', action: () => editor.chain().focus().addColumnBefore().run() },
        { icon: <ArrowUp size={ICON_SIZE} />, label: 'Insert Row Above', action: () => editor.chain().focus().addRowBefore().run() },
        { icon: <ArrowDown size={ICON_SIZE} />, label: 'Insert Row Below', action: () => editor.chain().focus().addRowAfter().run() },
        { divider: true, label: '' },
        { icon: <Trash2 size={ICON_SIZE} />, label: 'Delete Column', action: () => editor.chain().focus().deleteColumn().run() },
        { icon: <Trash2 size={ICON_SIZE} />, label: 'Delete Row', action: () => editor.chain().focus().deleteRow().run() },
        { divider: true, label: '' },
        { icon: <Trash2 size={ICON_SIZE} />, label: 'Delete Table', action: () => editor.chain().focus().deleteTable().run() },
      )
      break

    case 'hr':
      items.push(
        ...blockItems,
      )
      break

    case 'canvas':
      items.push(
        { icon: <Copy size={ICON_SIZE} />, label: 'Copy', action: () => { const t = window.getSelection()?.toString() ?? ''; copyToClipboard(t) } },
        { icon: <Clipboard size={ICON_SIZE} />, label: 'Paste', action: pasteFromClipboard },
        { divider: true, label: '' },
        { icon: <Plus size={ICON_SIZE} />, label: 'Add Block Below', action: () => { editor.commands.focus('end'); editor.commands.insertContent('<p></p>') } },
      )
      break
  }

  const handleSubEnter = (key: string) => {
    if (subTimerRef.current) clearTimeout(subTimerRef.current)
    setOpenSub(key)
  }
  const handleSubLeave = () => {
    subTimerRef.current = setTimeout(() => setOpenSub(null), 200)
  }

  return createPortal(
    <div ref={ref} className="context-menu" style={{ left: x, top: y }}>
      {items.map((item, i) => {
        if (item.divider) return <div key={`div-${i}`} className="ctx-divider" />

        if (item.sub) {
          return (
            <div
              key={item.label}
              style={{ position: 'relative' }}
              onMouseEnter={() => handleSubEnter(item.sub!)}
              onMouseLeave={handleSubLeave}
            >
              <button className="ctx-item">
                <span className="ctx-icon">{item.icon}</span>
                <span className="ctx-label">{item.label}</span>
                <span className="ctx-chevron"><ChevronRight size={12} /></span>
              </button>
              {openSub === item.sub && (
                item.sub === 'turnInto'
                  ? <TurnIntoSubMenu editor={editor} onClose={onClose} />
                  : <LanguageSubMenu editor={editor} onClose={onClose} />
              )}
            </div>
          )
        }

        return (
          <button
            key={item.label + i}
            className={`ctx-item ${item.disabled ? 'disabled' : ''} ${item.active ? 'active' : ''} ${item.className ?? ''}`}
            onClick={() => {
              if (item.disabled) return
              if (item.action) act(item.action)
            }}
          >
            <span className="ctx-icon">{item.icon}</span>
            <span className="ctx-label">{item.label}</span>
            {item.shortcut && <span className="ctx-shortcut">{item.shortcut}</span>}
          </button>
        )
      })}
    </div>,
    document.body,
  )
}
