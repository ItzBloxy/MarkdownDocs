import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string; action: string; disabled?: boolean }[]
}

const groups: ShortcutGroup[] = [
  {
    title: 'Formatting',
    shortcuts: [
      { keys: 'Ctrl+B', action: 'Bold' },
      { keys: 'Ctrl+I', action: 'Italic' },
      { keys: 'Ctrl+U', action: 'Underline' },
      { keys: 'Ctrl+Shift+X', action: 'Strikethrough' },
      { keys: 'Ctrl+E', action: 'Inline code' },
      { keys: 'Ctrl+K', action: 'Insert link' },
    ],
  },
  {
    title: 'Blocks',
    shortcuts: [
      { keys: 'Ctrl+Shift+7', action: 'Numbered list' },
      { keys: 'Ctrl+Shift+8', action: 'Bullet list' },
      { keys: 'Ctrl+Shift+9', action: 'Blockquote' },
      { keys: 'Tab', action: 'Indent list / code tab' },
      { keys: 'Shift+Tab', action: 'Outdent list' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: 'Ctrl+Z', action: 'Undo' },
      { keys: 'Ctrl+Shift+Z', action: 'Redo' },
      { keys: 'Shift+Enter', action: 'Line break' },
      { keys: '/', action: 'Slash commands' },
    ],
  },
  {
    title: 'File',
    shortcuts: [
      { keys: 'Ctrl+N', action: 'New' },
      { keys: 'Ctrl+O', action: 'Open' },
      { keys: 'Ctrl+S', action: 'Save' },
      { keys: 'Ctrl+Shift+S', action: 'Save as' },
      { keys: 'Ctrl+Shift+R', action: 'Revert to saved' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl+F', action: 'Find & replace' },
      { keys: 'Ctrl+Shift+P', action: 'Toggle preview', disabled: true },
      { keys: 'Escape', action: 'Close overlay' },
    ],
  },
]

interface Props {
  onClose: () => void
}

export function KeyboardShortcutsModal({ onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="dialog-header">
          <span className="meta">Help</span>
          <button ref={closeRef} type="button" className="icon-btn icon-btn-bare dialog-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="dialog-body">
          <div className="dialog-intro">
            <h2 id="shortcuts-title" className="dialog-title">Keyboard shortcuts</h2>
            <p className="dialog-lede">On macOS, use Cmd wherever you see Ctrl.</p>
          </div>
          <div className="shortcuts-grid">
            {groups.map(group => (
              <section key={group.title} className="shortcuts-group">
                <h3 className="meta">{group.title}</h3>
                {group.shortcuts.map(s => (
                  <div key={s.keys} className={`shortcut-row ${s.disabled ? 'is-disabled' : ''}`}>
                    <span>
                      {s.action}
                      {s.disabled && <span className="meta shortcut-soon">Soon</span>}
                    </span>
                    <span className="shortcut-keys">
                      {s.keys.split('+').map(k => (
                        <kbd key={k} className="kbd">{k}</kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
