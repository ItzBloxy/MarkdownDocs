import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { type EditorView } from '@tiptap/pm/view'

const ESCAPE_CHARS = new Set(['*', '~', '`', '|', '[', '_'])

export const EscapeHandler = Extension.create({
  name: 'escapeHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('escapeHandler'),
        props: {
          handleTextInput(view: EditorView, from: number, to: number, text: string) {
            if (!ESCAPE_CHARS.has(text)) return false

            const { state } = view
            const $from = state.doc.resolve(from)
            const parentText = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')

            // Check if the character before cursor is a backslash
            if (parentText.endsWith('\\')) {
              // Delete the backslash and insert the literal character
              const tr = state.tr
              tr.delete(from - 1, from)
              tr.insertText(text, from - 1)
              view.dispatch(tr)
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})
