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
      { keys: 'Ctrl+E', action: 'Inline Code' },
      { keys: 'Ctrl+K', action: 'Insert Link' },
    ],
  },
  {
    title: 'Block Types',
    shortcuts: [
      { keys: 'Ctrl+Shift+7', action: 'Ordered List' },
      { keys: 'Ctrl+Shift+8', action: 'Bullet List' },
      { keys: 'Ctrl+Shift+9', action: 'Blockquote' },
      { keys: 'Tab', action: 'Indent List / Code Tab' },
      { keys: 'Shift+Tab', action: 'Outdent List' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: 'Ctrl+Z', action: 'Undo' },
      { keys: 'Ctrl+Shift+Z', action: 'Redo' },
      { keys: 'Shift+Enter', action: 'Line Break' },
      { keys: '/', action: 'Slash Commands' },
    ],
  },
  {
    title: 'File',
    shortcuts: [
      { keys: 'Ctrl+S', action: 'Save', disabled: true },
      { keys: 'Ctrl+Shift+S', action: 'Save As', disabled: true },
      { keys: 'Ctrl+O', action: 'Open', disabled: true },
      { keys: 'Ctrl+N', action: 'New', disabled: true },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl+F', action: 'Find & Replace', disabled: true },
      { keys: 'Ctrl+Shift+P', action: 'Toggle Preview', disabled: true },
      { keys: 'Escape', action: 'Close Overlay' },
    ],
  },
]

interface Props {
  onClose: () => void
}

export function KeyboardShortcutsModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="shortcuts-grid">
          {groups.map(group => (
            <div key={group.title} className="shortcuts-group">
              <h3>{group.title}</h3>
              {group.shortcuts.map(s => (
                <div
                  key={s.keys}
                  className={`shortcut-row ${s.disabled ? 'disabled' : ''}`}
                >
                  <span className="shortcut-action">{s.action}</span>
                  <kbd className="shortcut-keys">{s.keys}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
