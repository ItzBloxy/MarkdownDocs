import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions, type SuggestionProps } from '@tiptap/suggestion'

export type SlashCommandState = {
  active: boolean
  query: string
  clientRect: (() => DOMRect) | null
  command: SuggestionProps['command'] | null
}

type StateCallback = (state: SlashCommandState) => void

let stateCallback: StateCallback | null = null

export function onSlashCommandState(cb: StateCallback) {
  stateCallback = cb
  return () => { stateCallback = null }
}

const suggestion: Omit<SuggestionOptions, 'editor'> = {
  char: '/',
  startOfLine: true,
  render: () => {
    return {
      onStart: (props) => {
        stateCallback?.({
          active: true,
          query: props.query,
          clientRect: props.clientRect as (() => DOMRect) | null,
          command: props.command,
        })
      },
      onUpdate: (props) => {
        stateCallback?.({
          active: true,
          query: props.query,
          clientRect: props.clientRect as (() => DOMRect) | null,
          command: props.command,
        })
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          stateCallback?.({ active: false, query: '', clientRect: null, command: null })
          return true
        }
        // Let the React component handle arrow keys and Enter
        const event = new CustomEvent('slash-keydown', { detail: { key: props.event.key } })
        document.dispatchEvent(event)
        if (['ArrowUp', 'ArrowDown', 'Enter'].includes(props.event.key)) {
          return true
        }
        return false
      },
      onExit: () => {
        stateCallback?.({ active: false, query: '', clientRect: null, command: null })
      },
    }
  },
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return { suggestion }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
