import type { Editor } from '@tiptap/react'
import {
  Plus, Minus, Columns3, Rows3, Trash2,
} from 'lucide-react'

interface TableToolbarProps {
  editor: Editor
}

export function TableToolbar({ editor }: TableToolbarProps) {
  return (
    <div className="table-toolbar">
      <button
        title="Add column"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <Columns3 size={14} />
      </button>
      <button
        title="Add row"
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <Rows3 size={14} />
      </button>
      <div className="sep" />
      <button
        title="Delete column"
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        <Columns3 size={14} style={{ opacity: 0.5 }} />
      </button>
      <button
        title="Delete row"
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <Rows3 size={14} style={{ opacity: 0.5 }} />
      </button>
      <div className="sep" />
      <button
        title="Delete table"
        className="danger"
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
