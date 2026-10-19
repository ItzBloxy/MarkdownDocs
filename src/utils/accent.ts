// Turns one user-picked accent into the CSS variables the Raster tokens use:
//   --accent        the color itself, for fills
//   --on-accent     black or white, whichever reads better on the fill
//   --accent-tint   a lighter variant that reads as a line on dark grounds
//   --accent-shade  a darker variant that reads as a line on light grounds
// index.css maps tint/shade onto --accent-line / --accent-on-invert per mode.

export const DEFAULT_ACCENT = '#6A0DAD'

export const ACCENT_PRESETS = [
  { name: 'Royal purple', hex: '#6A0DAD' },
  { name: 'Cobalt blue', hex: '#1F4FE0' },
  { name: 'Teal', hex: '#0B8C80' },
  { name: 'Forest green', hex: '#2F7D32' },
  { name: 'Amber', hex: '#E3A008' },
  { name: 'Orange', hex: '#F25C05' },
  { name: 'Red', hex: '#D7263D' },
  { name: 'Magenta', hex: '#C2187A' },
] as const

const DARK_GROUND = '#0B0B0B'
const LIGHT_GROUND = '#F0F0F0'
// Lines and marks must hold 4.5:1 against the ground they sit on
const MIN_CONTRAST = 4.5

type RGB = [number, number, number]
type HSL = [number, number, number]

export function normalizeHex(value: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1]
  return `#${h.toUpperCase()}`
}

function toRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function rgbToHsl([r, g, b]: RGB): HSL {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

function hslToRgb([h, s, l]: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Walk lightness toward `direction` until the color holds MIN_CONTRAST
// against `ground`. Starts no darker/lighter than `start`.
function variant(hex: string, ground: string, start: number, direction: 1 | -1): string {
  if (contrast(hex, ground) >= MIN_CONTRAST && (direction === 1 ? rgbToHsl(toRgb(hex))[2] >= start : rgbToHsl(toRgb(hex))[2] <= start)) {
    return hex
  }
  const [h, s, l] = rgbToHsl(toRgb(hex))
  let light = direction === 1 ? Math.max(l, start) : Math.min(l, start)
  let out = toHex(hslToRgb([h, s, light]))
  while (contrast(out, ground) < MIN_CONTRAST && light > 0.02 && light < 0.98) {
    light += 0.02 * direction
    out = toHex(hslToRgb([h, s, light]))
  }
  return out
}

export function accentVars(accent: string): Record<string, string> {
  const hex = normalizeHex(accent) ?? DEFAULT_ACCENT
  return {
    '--accent': hex,
    '--on-accent': contrast(hex, '#FFFFFF') >= contrast(hex, DARK_GROUND) ? '#FFFFFF' : DARK_GROUND,
    '--accent-tint': variant(hex, DARK_GROUND, 0.68, 1),
    '--accent-shade': variant(hex, LIGHT_GROUND, 0.45, -1),
  }
}
