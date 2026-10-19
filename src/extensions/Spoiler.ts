import { Mark, markInputRule } from '@tiptap/core'

const spoilerInputRegex = /\|\|([^|]+)\|\|$/

export const SpoilerMark = Mark.create({
  name: 'spoiler',

  parseHTML() {
    return [{ tag: 'span.spoiler' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'spoiler' }, 0]
  },

  addInputRules() {
    return [
      markInputRule({
        find: spoilerInputRegex,
        type: this.type,
      }),
    ]
  },
})
