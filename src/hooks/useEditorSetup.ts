import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { UnderlineMark } from '../extensions/Underline'
import { SpoilerMark } from '../extensions/Spoiler'
import { MarkdownLink } from '../extensions/MarkdownLink'
import { BoldItalicInputRule } from '../extensions/BoldItalic'
import { EscapeHandler } from '../extensions/EscapeHandler'
import { ListIndent } from '../extensions/ListIndent'
import { KeyboardShortcuts } from '../extensions/KeyboardShortcuts'
import { ShiftNumberKeymap } from '../extensions/ShiftNumberKeymap'
import { SlashCommands } from '../extensions/SlashCommands'
import { SearchAndReplace } from '../extensions/SearchAndReplace'
import { ImageNode } from '../extensions/Image'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'

export function useEditorSetup(onUpdate?: () => void) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {
          HTMLAttributes: { spellcheck: 'false' },
        },
        bold: {
          HTMLAttributes: {},
        },
      }),
      LinkExtension.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener',
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      UnderlineMark,
      SpoilerMark,
      ImageNode,
      MarkdownLink,
      BoldItalicInputRule,
      EscapeHandler,
      ListIndent,
      KeyboardShortcuts,
      ShiftNumberKeymap,
      SlashCommands,
      SearchAndReplace,
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: 'table-block' },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
      clipboardTextParser: (text, _$context, _plain, view) => {
        const nodes = text.split(/\n/).map(line => {
          if (!line) {
            return view.state.schema.nodes.paragraph!.create()
          }
          return view.state.schema.nodes.paragraph!.create(
            null,
            line ? view.state.schema.text(line) : undefined
          )
        })
        return view.state.schema.nodes.doc!.create(null, nodes).content
      },
      handlePaste: () => false,
    },
    onUpdate: () => {
      onUpdate?.()
    },
  })

  return editor
}
