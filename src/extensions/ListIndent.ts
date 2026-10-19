import { Extension } from '@tiptap/core'

export const ListIndent = Extension.create({
  name: 'listIndent',

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // In a code block, insert spaces
        if (editor.isActive('codeBlock')) {
          return editor.commands.insertContent('  ')
        }

        // In a list, sink (indent)
        if (editor.isActive('listItem')) {
          return editor.commands.sinkListItem('listItem')
        }

        // Outside list/code — suppress default
        return true
      },
      'Shift-Tab': ({ editor }) => {
        // In a list, lift (outdent)
        if (editor.isActive('listItem')) {
          return editor.commands.liftListItem('listItem')
        }
        return true
      },
    }
  },
})
