import { useRef, useEffect } from 'react'

export interface MenuItem {
  label: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  /** Renders a choice marker; true when this option is the current one. */
  checked?: boolean
  action?: () => void
}

interface MenuDropdownProps {
  items: MenuItem[]
  onClose: () => void
}

export function MenuDropdown({ items, onClose }: MenuDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // The parent holds the trigger too: clicking it should toggle, not close-then-reopen.
    const handleClick = (e: MouseEvent) => {
      const scope = ref.current?.parentElement ?? ref.current
      if (scope && !scope.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  return (
    <div ref={ref} className="menu" role="menu">
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={`sep-${i}`} className="menu-sep" role="separator" />
        }
        const isChoice = item.checked !== undefined
        return (
          <button
            key={item.label}
            type="button"
            role={isChoice ? 'menuitemradio' : 'menuitem'}
            aria-checked={isChoice ? item.checked : undefined}
            aria-disabled={item.disabled || undefined}
            className={`menu-item ${item.disabled ? 'is-disabled' : ''}`}
            onClick={() => {
              if (item.disabled) return
              item.action?.()
              onClose()
            }}
          >
            {isChoice && <span className={`menu-check ${item.checked ? 'is-on' : ''}`} aria-hidden="true" />}
            <span className="menu-item-label">{item.label}</span>
            {item.shortcut && (
              <span className="menu-item-shortcut">{item.shortcut}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
