import TiptapImage from '@tiptap/extension-image'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { imageFilesIn, insertImageFiles } from '../utils/imageFiles'

// Copying an image from a web page puts both its file and an <img> with the
// web address on the clipboard. Keep the address (the default HTML paste
// handles it) rather than embedding a base64 copy.
const hasWebImage = (data: DataTransfer | null) =>
  /<img[^>]+src=["']?https?:/i.test(data?.getData('text/html') ?? '')

// Markdown images are inline (badges sit side by side; a lone GIF is just a
// paragraph holding one image). Uploads are embedded as data: URLs, so base64
// must be allowed. The node view adds a Raster placeholder for images that
// fail to load — a dead URL or a relative path the app can't resolve.
export const ImageNode = TiptapImage.extend({
  // Pasted or dropped image files land at the caret / where they're dropped
  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        key: new PluginKey('imageFiles'),
        props: {
          handlePaste: (_view, event) => {
            const files = imageFilesIn(event.clipboardData?.files)
            if (files.length === 0 || hasWebImage(event.clipboardData)) return false
            void insertImageFiles(editor, files)
            return true
          },
          handleDrop: (view, event, _slice, moved) => {
            const files = imageFilesIn(event.dataTransfer?.files)
            if (moved || files.length === 0 || hasWebImage(event.dataTransfer)) return false
            event.preventDefault()
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
            void insertImageFiles(editor, files, pos)
            return true
          },
        },
      }),
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span')
      dom.className = 'image-node'

      const img = document.createElement('img')
      img.draggable = false // ProseMirror drags the whole node instead

      const fallback = document.createElement('span')
      fallback.className = 'image-fallback'
      fallback.setAttribute('aria-hidden', 'true')
      const label = document.createElement('span')
      label.className = 'image-fallback-label'
      label.textContent = 'Image not found'
      const alt = document.createElement('span')
      alt.className = 'image-fallback-alt'
      fallback.append(label, alt)

      img.addEventListener('load', () => dom.classList.remove('is-broken'))
      img.addEventListener('error', () => dom.classList.add('is-broken'))

      const render = (n: PMNode) => {
        const { src, alt: altText, title } = n.attrs as { src: string | null; alt: string | null; title: string | null }
        if (altText) img.alt = altText
        else img.removeAttribute('alt')
        if (title) img.title = title
        else img.removeAttribute('title')
        alt.textContent = altText || src?.split(/[/\\]/).pop()?.split(/[?#]/)[0] || ''
        // Only a new src resets the broken state; other attribute edits keep it
        if (!src) {
          img.removeAttribute('src')
          dom.classList.add('is-broken')
        } else if (img.getAttribute('src') !== src) {
          dom.classList.remove('is-broken')
          img.src = src
        }
      }

      dom.append(img, fallback)
      render(node)

      return {
        dom,
        update: (updated) => {
          if (updated.type !== node.type) return false
          render(updated)
          return true
        },
      }
    }
  },
}).configure({
  inline: true,
  allowBase64: true,
})
