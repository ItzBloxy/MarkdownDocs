import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const ShiftNumberKeymap = Extension.create({
  name: 'shiftNumberKeymap',

  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        key: new PluginKey('shiftNumberKeymap'),
        props: {
          handleKeyDown(_view, event) {
            const mod = event.ctrlKey || event.metaKey
            if (!mod || !event.shiftKey) return false

            switch (event.code) {
              case 'Digit7':
                event.preventDefault()
                editor.chain().focus().toggleOrderedList().run()
                return true
              case 'Digit8':
                event.preventDefault()
                editor.chain().focus().toggleBulletList().run()
                return true
              case 'Digit9':
                event.preventDefault()
                editor.chain().focus().toggleBlockquote().run()
                return true
              default:
                return false
            }
          },
        },
      }),
    ]
  },
})
