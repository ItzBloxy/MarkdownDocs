import { Mark, markInputRule } from '@tiptap/core'

const underlineInputRegex = /(?:^|\s)__([^_]+)__$/

export const UnderlineMark = Mark.create({
  name: 'underline',

  parseHTML() {
    return [{ tag: 'u' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['u', HTMLAttributes, 0]
  },

  addInputRules() {
    return [
      markInputRule({
        find: underlineInputRegex,
        type: this.type,
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleMark(this.name),
    }
  },
})
