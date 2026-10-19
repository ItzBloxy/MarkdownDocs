import { Extension, type Editor } from '@tiptap/core'
import { InputRule } from '@tiptap/core'

const boldItalicInputRegex = /\*\*\*([^*]+)\*\*\*$/

function applyBoldItalic(editor: Editor, match: RegExpMatchArray, start: number, end: number) {
  const text = match[1]
  const { tr, schema } = editor.state
  const boldMark = schema.marks.bold?.create()
  const italicMark = schema.marks.italic?.create()

  if (!boldMark || !italicMark) return null

  tr.insertText(text, start, end)
  tr.addMark(start, start + text.length, boldMark)
  tr.addMark(start, start + text.length, italicMark)
  tr.removeStoredMark(boldMark)
  tr.removeStoredMark(italicMark)

  return tr
}

export const BoldItalicInputRule = Extension.create({
  name: 'boldItalicInputRule',

  addInputRules() {
    return [
      new InputRule({
        find: boldItalicInputRegex,
        handler: ({ state, range, match }) => {
          const text = match[1]
          const { tr, schema } = state
          const boldMark = schema.marks.bold?.create()
          const italicMark = schema.marks.italic?.create()

          if (!boldMark || !italicMark) return

          tr.insertText(text, range.from, range.to)
          tr.addMark(range.from, range.from + text.length, boldMark)
          tr.addMark(range.from, range.from + text.length, italicMark)
          tr.removeStoredMark(boldMark)
          tr.removeStoredMark(italicMark)
        },
      }),
    ]
  },
})
