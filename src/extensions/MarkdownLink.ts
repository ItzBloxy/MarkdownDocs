import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { type EditorView } from '@tiptap/pm/view'

// Not after "!": that's an image, which the Image extension's input rule converts
const LINK_REGEX = /(?<!!)\[([^\]]+)\]\(([^)]+)\)$/

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export const MarkdownLink = Extension.create({
  name: 'markdownLink',

  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        key: new PluginKey('markdownLink'),
        props: {
          handleTextInput(view: EditorView, from: number, to: number, text: string) {
            // Only check on closing paren
            if (text !== ')') return false

            const { state } = view
            const $from = state.doc.resolve(from)
            const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc') + text

            const match = LINK_REGEX.exec(textBefore)
            if (!match) return false

            const [fullMatch, linkText, url] = match
            if (!isValidUrl(url)) return false

            const start = from - fullMatch.length + 1
            const end = to + 1

            const tr = state.tr
            tr.insertText(linkText, start, end)

            const linkMark = state.schema.marks.link?.create({ href: url, target: '_blank', rel: 'noopener' })
            if (linkMark) {
              tr.addMark(start, start + linkText.length, linkMark)
              tr.removeStoredMark(linkMark)
            }

            editor.view.dispatch(tr)
            return true
          },
        },
      }),
    ]
  },
})
