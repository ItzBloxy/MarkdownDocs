import type { Editor } from '@tiptap/react'
import type { Node as PMNode } from '@tiptap/pm/model'

function escapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u200B/g, '') // zero-width spaces
}

function inlineToMarkdown(node: PMNode): string {
  let text = ''

  node.forEach((child) => {
    if (child.isText) {
      let t = child.text ?? ''
      // Apply marks
      const marks = child.marks
      for (const mark of marks) {
        switch (mark.type.name) {
          case 'bold':
            t = `**${t}**`
            break
          case 'italic':
            t = `*${t}*`
            break
          case 'underline':
            t = `__${t}__`
            break
          case 'strike':
            t = `~~${t}~~`
            break
          case 'code':
            t = `\`${t}\``
            break
          case 'link':
            t = `[${t}](${mark.attrs.href})`
            break
          case 'spoiler':
            t = `||${t}||`
            break
        }
      }
      text += t
    } else if (child.type.name === 'hardBreak') {
      text += '\n'
    }
  })

  return escapeHtml(text)
}

function serializeTable(node: PMNode): string {
  const rows: string[][] = []

  node.forEach((row) => {
    const cells: string[] = []
    row.forEach((cell) => {
      let cellText = ''
      cell.forEach((p) => {
        cellText += inlineToMarkdown(p)
      })
      // Escape pipes so the cell survives re-import as a single cell
      cells.push(cellText.replace(/\|/g, '\\|'))
    })
    rows.push(cells)
  })

  if (rows.length === 0) return ''

  const colCount = Math.max(...rows.map(r => r.length))
  const colWidths: number[] = []
  for (let c = 0; c < colCount; c++) {
    colWidths.push(Math.max(3, ...rows.map(r => (r[c] ?? '').length)))
  }

  const formatRow = (cells: string[]) =>
    '| ' + cells.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ') + ' |'

  const lines: string[] = []
  if (rows.length > 0) {
    lines.push(formatRow(rows[0]))
    lines.push('| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |')
    for (let i = 1; i < rows.length; i++) {
      lines.push(formatRow(rows[i]))
    }
  }

  return lines.join('\n')
}

function getListIndent(node: PMNode, depth: number): string {
  return '  '.repeat(depth)
}

function serializeNode(node: PMNode, listDepth: number = 0, orderedIndex: number = 1): string {
  switch (node.type.name) {
    case 'paragraph':
      return inlineToMarkdown(node)

    case 'heading':
      return '#'.repeat(node.attrs.level) + ' ' + inlineToMarkdown(node)

    case 'bulletList': {
      const items: string[] = []
      node.forEach((item) => {
        let first = true
        item.forEach((child) => {
          if (child.type.name === 'bulletList' || child.type.name === 'orderedList') {
            items.push(serializeNode(child, listDepth + 1))
          } else {
            const prefix = first ? getListIndent(node, listDepth) + '- ' : getListIndent(node, listDepth) + '  '
            items.push(prefix + serializeNode(child, listDepth))
            first = false
          }
        })
      })
      return items.join('\n')
    }

    case 'orderedList': {
      const items: string[] = []
      let idx = Number(node.attrs.start) || 1
      node.forEach((item) => {
        let first = true
        item.forEach((child) => {
          if (child.type.name === 'bulletList' || child.type.name === 'orderedList') {
            items.push(serializeNode(child, listDepth + 1))
          } else {
            const prefix = first ? getListIndent(node, listDepth) + `${idx}. ` : getListIndent(node, listDepth) + '   '
            items.push(prefix + serializeNode(child, listDepth))
            if (first) idx++
            first = false
          }
        })
      })
      return items.join('\n')
    }

    case 'blockquote': {
      const lines: string[] = []
      node.forEach((child) => {
        const text = serializeNode(child)
        for (const line of text.split('\n')) {
          lines.push('> ' + line)
        }
      })
      return lines.join('\n')
    }

    case 'codeBlock': {
      const lang = node.attrs.language || ''
      let code = ''
      node.forEach((child) => {
        if (child.isText) code += child.text
      })
      return '```' + lang + '\n' + code + '\n```'
    }

    case 'horizontalRule':
      return '---'

    case 'table':
      return serializeTable(node)

    default:
      return inlineToMarkdown(node)
  }
}

export function editorToMarkdown(editor: Editor): string {
  const doc = editor.state.doc
  const lines: string[] = []

  doc.forEach((node) => {
    lines.push(serializeNode(node))
  })

  // Markdown files conventionally end with a newline
  return lines.join('\n\n') + '\n'
}

export function nodeToMarkdown(node: PMNode): string {
  return serializeNode(node)
}
