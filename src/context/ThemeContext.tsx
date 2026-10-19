import { useState, useLayoutEffect, useSyncExternalStore, type ReactNode } from 'react'
import { accentVars, normalizeHex, DEFAULT_ACCENT } from '../utils/accent'
import { ThemeContext, type ThemeMode } from './theme'

// index.html reads this key before first paint to avoid a flash of the
// wrong theme — keep the shape ({ mode, accent, vars }) in sync with it
const STORAGE_KEY = 'markdowndocs.theme'

function loadSaved(): { mode: ThemeMode; accent: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    const mode = ['dark', 'light', 'system'].includes(saved?.mode) ? saved.mode : 'dark'
    return { mode, accent: normalizeHex(saved?.accent ?? '') ?? DEFAULT_ACCENT }
  } catch {
    return { mode: 'dark', accent: DEFAULT_ACCENT }
  }
}

const lightQuery = '(prefers-color-scheme: light)'
function subscribeToSystem(onChange: () => void) {
  const mq = window.matchMedia(lightQuery)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadSaved)
  const [mode, setMode] = useState<ThemeMode>(initial.mode)
  const [accent, setAccentState] = useState(initial.accent)
  const systemLight = useSyncExternalStore(subscribeToSystem, () => window.matchMedia(lightQuery).matches)
  const resolved = mode === 'system' ? (systemLight ? 'light' : 'dark') : mode

  useLayoutEffect(() => {
    const root = document.documentElement
    const vars = accentVars(accent)
    root.dataset.theme = resolved
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', resolved)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#F0F0F0' : '#0B0B0B')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, accent, vars }))
    } catch { /* storage unavailable: the theme still applies for this session */ }
  }, [mode, accent, resolved])

  const setAccent = (hex: string) => {
    const valid = normalizeHex(hex)
    if (valid) setAccentState(valid)
  }

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}
