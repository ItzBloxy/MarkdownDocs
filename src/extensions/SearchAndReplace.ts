import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

interface MatchResult {
  from: number
  to: number
}

interface SearchMeta {
  query?: string
  action?: 'next' | 'prev' | 'replace' | 'replaceAll'
  replacement?: string
}

export interface SearchState {
  query: string
  matchCount: number
  currentIndex: number
}

const searchPluginKey = new PluginKey('searchAndReplace')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchAndReplace: {
      setSearchQuery: (query: string) => ReturnType
      nextSearchMatch: () => ReturnType
      prevSearchMatch: () => ReturnType
      replaceSearchMatch: (replacement: string) => ReturnType
      replaceAllSearchMatches: (replacement: string) => ReturnType
    }
  }
}

function findMatches(doc: any, query: string): MatchResult[] {
  if (!query) return []
  const results: MatchResult[] = []
  const search = query.toLowerCase()
  doc.descendants((node: any, pos: number) => {
    if (!node.isText) return
    const text = (node.text ?? '').toLowerCase()
    let idx = 0
    while (idx < text.length) {
      const found = text.indexOf(search, idx)
      if (found === -1) break
      results.push({ from: pos + found, to: pos + found + search.length })
      idx = found + 1
    }
  })
  return results
}

function buildDecorations(doc: any, matches: MatchResult[], currentIndex: number): DecorationSet {
  if (matches.length === 0) return DecorationSet.empty
  const decos = matches.map((m, i) =>
    Decoration.inline(m.from, m.to, {
      class: i === currentIndex ? 'search-match search-match-current' : 'search-match',
    })
  )
  return DecorationSet.create(doc, decos)
}

export const SearchAndReplace = Extension.create({
  name: 'searchAndReplace',

  addStorage() {
    return {
      query: '' as string,
      matches: [] as MatchResult[],
      currentIndex: 0,
      listeners: [] as ((s: SearchState) => void)[],
    }
  },

  addCommands() {
    return {
      setSearchQuery: (query: string) => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(searchPluginKey, { query } as SearchMeta)
        return true
      },
      nextSearchMatch: () => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(searchPluginKey, { action: 'next' } as SearchMeta)
        return true
      },
      prevSearchMatch: () => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(searchPluginKey, { action: 'prev' } as SearchMeta)
        return true
      },
      replaceSearchMatch: (replacement: string) => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(searchPluginKey, { action: 'replace', replacement } as SearchMeta)
        return true
      },
      replaceAllSearchMatches: (replacement: string) => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(searchPluginKey, { action: 'replaceAll', replacement } as SearchMeta)
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage
    const editor = this.editor

    const notify = () => {
      const state: SearchState = {
        query: storage.query,
        matchCount: storage.matches.length,
        currentIndex: storage.currentIndex,
      }
      for (const cb of storage.listeners) cb(state)
    }

    const reSearch = (doc: any) => {
      storage.matches = findMatches(doc, storage.query)
    }

    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init() {
            return { decorations: DecorationSet.empty, scrollVersion: 0 }
          },
          apply(tr, old, _oldState, newState) {
            const meta = tr.getMeta(searchPluginKey) as SearchMeta | undefined
            let scrollVersion = old.scrollVersion

            if (meta?.query !== undefined) {
              storage.query = meta.query
              storage.currentIndex = 0
              reSearch(newState.doc)
              notify()
              if (storage.matches.length > 0) scrollVersion++
            } else if (meta?.action === 'next' && storage.matches.length > 0) {
              storage.currentIndex = (storage.currentIndex + 1) % storage.matches.length
              notify()
              scrollVersion++
            } else if (meta?.action === 'prev' && storage.matches.length > 0) {
              storage.currentIndex = (storage.currentIndex - 1 + storage.matches.length) % storage.matches.length
              notify()
              scrollVersion++
            } else if (meta?.action === 'replace' && meta.replacement !== undefined) {
              const match = storage.matches[storage.currentIndex]
              if (match) {
                setTimeout(() => {
                  const { state: st, dispatch } = editor.view
                  dispatch(st.tr.insertText(meta.replacement!, match.from, match.to))
                  reSearch(editor.state.doc)
                  if (storage.currentIndex >= storage.matches.length) {
                    storage.currentIndex = Math.max(0, storage.matches.length - 1)
                  }
                  notify()
                  // Force decoration rebuild
                  editor.view.dispatch(editor.state.tr.setMeta(searchPluginKey, {}))
                }, 0)
              }
            } else if (meta?.action === 'replaceAll' && meta.replacement !== undefined) {
              setTimeout(() => {
                const { state: st, dispatch } = editor.view
                const sorted = [...storage.matches].sort((a, b) => b.from - a.from)
                const t = st.tr
                for (const m of sorted) t.insertText(meta.replacement!, m.from, m.to)
                dispatch(t)
                storage.matches = []
                storage.currentIndex = 0
                notify()
              }, 0)
            } else if (tr.docChanged && storage.query) {
              reSearch(newState.doc)
              if (storage.currentIndex >= storage.matches.length) {
                storage.currentIndex = Math.max(0, storage.matches.length - 1)
              }
              notify()
            }

            return {
              decorations: buildDecorations(newState.doc, storage.matches, storage.currentIndex),
              scrollVersion,
            }
          },
        },
        props: {
          decorations(state) {
            return searchPluginKey.getState(state)?.decorations
          },
        },
        view() {
          let lastVersion = 0
          return {
            update(view) {
              const pluginState = searchPluginKey.getState(view.state)
              if (!pluginState || pluginState.scrollVersion === lastVersion) return
              lastVersion = pluginState.scrollVersion
              requestAnimationFrame(() => {
                const el = view.dom.querySelector('.search-match-current')
                if (el instanceof HTMLElement) {
                  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
                }
              })
            },
          }
        },
      }),
    ]
  },
})
