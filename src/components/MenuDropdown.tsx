import { useRef, useEffect } from 'react'

export interface MenuItem {
  label: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
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
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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
    <div ref={ref} className="menu-dropdown">
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={`sep-${i}`} className="menu-dropdown-sep" />
        }
        return (
          <div
            key={item.label}
            className={`menu-dropdown-item ${item.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (item.disabled) return
              item.action?.()
              onClose()
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="menu-dropdown-shortcut">{item.shortcut}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
