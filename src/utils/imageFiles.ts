import type { Editor } from '@tiptap/react'
import { showToast } from '../components/Toast'

export function imageFilesIn(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter(f => f.type.startsWith('image/'))
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// "my_holiday-photo.jpg" → "my holiday photo"
const altFromName = (name: string) => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()

// Local files have no address the .md file could point at, so they're
// embedded as data: URLs — the document stays self-contained everywhere.
// Inserts at `pos`, or over the current selection when `pos` is omitted.
export async function insertImageFiles(editor: Editor, files: File[], pos?: number, alt?: string) {
  if (files.length === 0) return
  let sources: string[]
  try {
    sources = await Promise.all(files.map(readAsDataUrl))
  } catch {
    showToast("Couldn't read that image file.")
    return
  }
  const content = files.map((file, i) => ({
    type: 'image',
    attrs: { src: sources[i], alt: alt || altFromName(file.name) || null },
  }))
  if (pos === undefined) editor.chain().focus().insertContent(content).run()
  else editor.chain().focus().insertContentAt(pos, content).run()

  const total = files.reduce((n, f) => n + f.size, 0)
  showToast(files.length === 1
    ? `Embedded ${files[0].name} (${formatSize(total)})`
    : `Embedded ${files.length} images (${formatSize(total)})`)
}
