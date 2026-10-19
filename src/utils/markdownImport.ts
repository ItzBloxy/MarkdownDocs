// Converts raw markdown text into TipTap-compatible HTML

function escapeForHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeForAttribute(text: string): string {
  return escapeForHtml(text).replace(/"/g, '&quot;')
}

function convertInlineMarkdown(text: string): string {
  let result = escapeForHtml(text)

  // Bold+Italic: ***text***
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic: *text*
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  // Underline: __text__
  result = result.replace(/__(.+?)__/g, '<u>$1</u>')
  // Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>')
  // Inline code: `text`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Spoiler: ||text||
  result = result.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>')
  // Link: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  return result
}

// A list item marker: optional indent, then -, * or + or "N." plus whitespace
function isListLine(line: string): boolean {
  return /^(\s*)([-*+]|\d+\.)\s+/.test(line)
}

// Thematic break: three or more -, * or _ with optional spaces between
// ("---", "***", "- - -", "* * *")
function isHrLine(line: string): boolean {
  return /^([-*_])(\s*\1){2,}\s*$/.test(line.trim())
}

// Indented code: 4 spaces or a tab of indent — unless the line parses as a
// (nested) list item, which also relies on leading indentation
function isIndentedCodeLine(line: string): boolean {
  return /^(?: {4}|\t)/.test(line) && line.trim() !== '' && !isListLine(line)
}

// Split a table row into cells. Outer pipes are optional (GFM style), and
// \| is a literal pipe inside a cell rather than a cell boundary.
const ESCAPED_PIPE = '\u0000'
function splitTableRow(row: string): string[] {
  const marked = row.trim().replace(/\\\|/g, ESCAPED_PIPE)
  let cells = marked.split('|')
  if (marked.startsWith('|')) cells = cells.slice(1)
  if (marked.endsWith('|') && cells.length > 0) cells = cells.slice(0, -1)
  return cells.map(c => c.split(ESCAPED_PIPE).join('|'))
}

function isTableSeparator(line: string): boolean {
  const t = line.trim()
  if (!t.includes('|')) return false
  const cells = splitTableRow(t)
  return cells.length > 0 && cells.every(c => /^:?-+:?$/.test(c.trim()))
}

// A table starts where a row containing pipes is followed by a separator row
// with the same column count (GFM requires the counts to match — this also
// keeps prose that merely contains "|" from being eaten as a table)
function isTableStart(lines: string[], i: number): boolean {
  const line = lines[i]
  if (!line.includes('|') || i + 1 >= lines.length) return false
  if (isTableSeparator(line) || !isTableSeparator(lines[i + 1])) return false
  return splitTableRow(line).length === splitTableRow(lines[i + 1]).length
}

// True when lines[i] begins a construct that must not be swallowed into a
// preceding soft-wrapped paragraph
function startsNewBlock(lines: string[], i: number): boolean {
  const line = lines[i]
  return (
    line.trim() === '' ||
    line.startsWith('```') ||
    isHrLine(line) ||
    /^#{1,3}\s+/.test(line) ||
    /^>/.test(line) ||
    isListLine(line) ||
    isIndentedCodeLine(line) ||
    isTableStart(lines, i)
  )
}

export function markdownToHtml(text: string): string {
  // Normalize before parsing: strip a UTF-8 BOM (Tauri's readTextFile keeps
  // it, unlike the browser's file.text()) and fold CRLF/CR to LF — a stray
  // \r or \uFEFF defeats the `^` and `(.+)$` patterns below
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')
  const htmlParts: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      // First word of the info string is the language; TipTap's CodeBlock
      // only recognizes it as class="language-*"
      const lang = line.slice(3).trim().split(/\s+/)[0] ?? ''
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      const code = escapeForHtml(codeLines.join('\n'))
      const langAttr = lang ? ` class="language-${escapeForAttribute(lang)}"` : ''
      htmlParts.push(`<pre><code${langAttr}>${code}</code></pre>`)
      continue
    }

    // Table
    if (isTableStart(lines, i)) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      // Rows are padded/truncated to the header's column count (GFM rule)
      const colCount = splitTableRow(tableLines[0]).length
      const parseRow = (row: string) => {
        const cells = splitTableRow(row).map(cell => convertInlineMarkdown(cell.trim()))
        while (cells.length < colCount) cells.push('')
        return cells.slice(0, colCount)
      }

      const headers = parseRow(tableLines[0])
      // Skip separator row (index 1)
      const bodyRows = tableLines.slice(2).map(parseRow)

      let tableHtml = '<table><thead><tr>'
      for (const h of headers) {
        tableHtml += `<th><p>${h}</p></th>`
      }
      tableHtml += '</tr></thead><tbody>'
      for (const row of bodyRows) {
        tableHtml += '<tr>'
        for (const cell of row) {
          tableHtml += `<td><p>${cell}</p></td>`
        }
        tableHtml += '</tr>'
      }
      tableHtml += '</tbody></table>'
      htmlParts.push(tableHtml)
      continue
    }

    // Horizontal rule
    if (isHrLine(line)) {
      htmlParts.push('<hr>')
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      htmlParts.push(`<h${level}>${convertInlineMarkdown(headingMatch[2])}</h${level}>`)
      i++
      continue
    }

    // Blockquote (handles "> text", ">text", and ">" empty lines)
    if (/^>/.test(line)) {
      const quoteContent: string[] = []
      while (i < lines.length && /^>/.test(lines[i])) {
        quoteContent.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      // Parse inner content: headings stand alone, consecutive text lines form paragraphs
      let innerHtml = ''
      let j = 0
      while (j < quoteContent.length) {
        const qline = quoteContent[j]
        if (qline === '') {
          j++
          continue
        }
        const headingMatch = qline.match(/^(#{1,3})\s+(.+)$/)
        if (headingMatch) {
          const level = headingMatch[1].length
          innerHtml += `<h${level}>${convertInlineMarkdown(headingMatch[2])}</h${level}>`
          j++
        } else {
          // Collect consecutive non-heading, non-empty lines into a paragraph
          const paraLines: string[] = []
          while (j < quoteContent.length && quoteContent[j] !== '' && !/^#{1,3}\s+/.test(quoteContent[j])) {
            paraLines.push(quoteContent[j])
            j++
          }
          // A heading-like line the heading regex rejected (e.g. "# " with no
          // text) would otherwise loop forever: consume it so j always advances
          if (paraLines.length === 0) {
            paraLines.push(quoteContent[j])
            j++
          }
          innerHtml += `<p>${paraLines.map(convertInlineMarkdown).join('<br>')}</p>`
        }
      }
      htmlParts.push(`<blockquote>${innerHtml}</blockquote>`)
      continue
    }

    // Lists (bullet or ordered, with nesting via indentation)
    if (isListLine(line)) {
      const listLines: { indent: number; content: string; ordered: boolean; num: number }[] = []
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/)
        if (!m) break
        listLines.push({
          indent: m[1].length,
          ordered: /^\d/.test(m[2]),
          num: parseInt(m[2], 10) || 1,
          content: m[3],
        })
        i++
      }

      // A marker line the item regex rejected (e.g. "- " with no text) would
      // otherwise loop forever: emit it as a paragraph so i always advances
      if (listLines.length === 0) {
        htmlParts.push(`<p>${convertInlineMarkdown(line)}</p>`)
        i++
        continue
      }

      // Build nested HTML using a stack of currently open lists
      let html = ''
      const stack: { indent: number; tag: string }[] = []

      for (const { indent, content, ordered, num } of listLines) {
        const tag = ordered ? 'ol' : 'ul'
        // Ordered lists that don't start at 1 keep their start number
        const openTag = tag === 'ol' && num !== 1 ? `<ol start="${num}">` : `<${tag}>`

        // Close lists deeper than current indent
        while (stack.length > 0 && stack[stack.length - 1].indent > indent) {
          html += `</li></${stack.pop()!.tag}>`
        }

        if (stack.length === 0 || stack[stack.length - 1].indent < indent) {
          // Going deeper — open new nested list inside the previous <li>
          html += openTag
          stack.push({ indent, tag })
        } else {
          // Same indent level — close previous <li>
          html += '</li>'
          // Switch list type if needed at the same level
          if (stack[stack.length - 1].tag !== tag) {
            html += `</${stack[stack.length - 1].tag}>${openTag}`
            stack[stack.length - 1].tag = tag
          }
        }

        html += `<li><p>${convertInlineMarkdown(content)}</p>`
      }

      while (stack.length > 0) {
        html += `</li></${stack.pop()!.tag}>`
      }

      htmlParts.push(html)
      continue
    }

    // Indented code block (4 spaces or a tab per line)
    if (isIndentedCodeLine(line)) {
      const codeLines: string[] = []
      while (i < lines.length) {
        if (isIndentedCodeLine(lines[i])) {
          codeLines.push(lines[i].replace(/^(?: {4}|\t)/, ''))
          i++
        } else if (lines[i].trim() === '') {
          // Interior blank lines belong to the block only if more indented
          // code follows
          let k = i
          while (k < lines.length && lines[k].trim() === '') k++
          if (k < lines.length && isIndentedCodeLine(lines[k])) {
            for (let b = i; b < k; b++) codeLines.push('')
            i = k
          } else {
            break
          }
        } else {
          break
        }
      }
      htmlParts.push(`<pre><code>${escapeForHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph: consecutive plain lines form one soft-wrapped paragraph,
    // joined with hard breaks so the original line structure survives
    // import → edit → export
    const paraLines: string[] = [line]
    i++
    while (i < lines.length && !startsNewBlock(lines, i)) {
      paraLines.push(lines[i])
      i++
    }
    htmlParts.push(`<p>${paraLines.map(convertInlineMarkdown).join('<br>')}</p>`)
  }

  return htmlParts.join('')
}
