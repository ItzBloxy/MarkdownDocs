# MarkdownDocs — Spellcheck Design

## Context

The custom right-click context menu suppresses the browser's native spellcheck suggestions. This feature adds a JavaScript-based spellchecker using typo.js with suggestions in the context menu and a language selector in the menu bar.

## Decisions

| Decision | Choice |
|----------|--------|
| Spellcheck engine | typo.js (JS Hunspell) |
| Languages | EN_US, DA_DK only |
| Underline style | Straight glowing purple (not red wavy) |
| Dictionary loading | Fetch .aff + .dic from CDN on demand |
| Native spellcheck | Disabled on all contenteditable |

## Implementation

### Spellcheck Engine (useSpellcheck hook)

- Load typo.js with Hunspell dictionaries (.aff + .dic files)
- On editor update (debounced 500ms), scan visible text nodes
- Check each word against dictionary, collect misspelled words with positions
- Apply ProseMirror Decoration.inline with class `misspelled` on each
- Store ignore list (session) and custom dictionary (localStorage)

### Underline Style

Straight glowing purple underline via CSS:
- `text-decoration: underline var(--accent)` with `text-underline-offset: 3px`
- Subtle glow: `text-shadow: 0 1px 4px rgba(160, 122, 255, 0.3)`
- No red, no wavy — clean accent-colored straight line

### Context Menu Integration

When right-clicking a misspelled word (detected by checking if cursor position falls within a `misspelled` decoration):
- Top of menu: up to 5 suggestions (bold text, clicking replaces the word)
- "Add to Dictionary" — adds word to localStorage custom dict, removes underline
- "Ignore All" — adds to session ignore list, removes all instances
- Divider
- Then normal context items for that context type

### Language Selector

New dropdown "Language" in TitleMenuBar between Format and Help:
- Shows current language with flag/label
- Two items: English (US) ✓, Dansk (DA)
- Switching reloads dictionary and re-checks document
- Selected language stored in localStorage

### Dictionary Sources

Fetch from CDN (e.g., jsdelivr hosting of Hunspell dicts):
- `en_US.aff` + `en_US.dic`
- `da_DK.aff` + `da_DK.dic`
- Cache in memory after first load

### New/Modified Files

- Install: `typo-js` npm package
- `src/hooks/useSpellcheck.ts` — engine, decorations, suggestions
- `src/styles/spellcheck.css` — purple underline style
- `src/components/ContextMenu.tsx` — prepend suggestions
- `src/components/TitleMenuBar.tsx` — add Language menu
- `src/hooks/useEditorSetup.ts` — disable native spellcheck

## Verification

1. Misspelled words show straight purple underline
2. Right-click misspelled word → top of menu shows suggestions
3. Clicking suggestion replaces the word
4. "Add to Dictionary" removes underline permanently
5. "Ignore All" removes all instances for session
6. Language menu switches between EN_US and DA_DK
7. Switching language re-checks document
8. Code blocks are not spellchecked
9. No native red underlines visible
