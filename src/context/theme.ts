import { createContext, useContext } from 'react'

export type ThemeMode = 'dark' | 'light' | 'system'

export interface ThemeContextValue {
  mode: ThemeMode
  accent: string
  setMode: (mode: ThemeMode) => void
  setAccent: (hex: string) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
