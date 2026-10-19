import { Extension } from '@tiptap/core'
import { showToast } from '../components/Toast'

// File operations are handled by App.tsx via window keydown listener.
// This extension only prevents browser defaults and handles editor-specific shortcuts.

const comingSoon = () => {
  showToast('Coming soon')
  return true
}

export const KeyboardShortcuts = Extension.create({
  name: 'customKeyboardShortcuts',

  addKeyboardShortcuts() {
    return {
      // Formatting
      'Mod-e': () => this.editor.commands.toggleCode(),
      'Mod-Shift-x': () => this.editor.commands.toggleStrike(),

      // File shortcuts — preventDefault only (actual handling in App.tsx)
      'Mod-s': () => true,
      'Mod-Shift-s': () => true,
      'Mod-o': () => true,
      'Mod-n': () => true,
      'Mod-Shift-r': () => true,
      // Mod-f handled by App.tsx
      // Preview mode removed from scope
      'Mod-Shift-p': comingSoon,
    }
  },
})
