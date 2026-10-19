# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server on port 5173 (matches .claude/launch.json)
npm run build      # tsc -b (project references) then vite build
npm run lint       # eslint .
npm run preview    # serve the built bundle
npm run app:dev    # Tauri desktop app in dev mode (starts npm run dev itself — don't run both)
npm run app:build  # build the desktop executable
```

Note: Tauri's `beforeBuildCommand` is `npx vite build` (see `src-tauri/tauri.conf.json`), so `app:build` does **not** typecheck. `npm run build` is the only script that runs `tsc -b`.

There is **no test framework** configured (no Jest, Vitest, Playwright, etc.). Verification is manual via `npm run dev` + the browser preview tools.

TypeScript uses project references: `tsconfig.json` is the root, with `tsconfig.app.json` (src) and `tsconfig.node.json` (config files). Use `npx tsc -b` (or `npm run build`) to typecheck — running `tsc` without `-b` will not pick up the right config.

## Architecture

This is a desktop-only single-page **markdown editor** built on **Tiptap 3** (which sits on top of ProseMirror). It ships in two forms with no backend in either:

1. **Web app** for desktop browsers — file I/O via the **File System Access API**, with a degraded fallback (`<input type="file">` open, blob-download save) on browsers that lack it.
2. **Tauri 2 desktop app** (`src-tauri/`, product name "MarkdownDocs") — file I/O via `@tauri-apps/plugin-fs`/`plugin-dialog`, with OS file associations for `.md`/`.markdown`/`.txt` ("Open with" launches pass the path as `argv[1]`).

The same React bundle serves both; `useFileSystem` picks the mode at runtime via `isTauri()`.

### Component tree

```
App
└── DesktopGate           # Blocks viewports narrower than 1024px (nothing else)
    └── DocumentProvider  # Context: docName, isDirty, isFavorite, previewMode
        └── EditorApp     # src/App.tsx — the actual editor shell
```

`EditorApp` (in `src/App.tsx`) wires together the editor (`useEditorSetup`), stats (`useEditorStats`), file I/O (`useFileSystem`), spellcheck (`useSpellcheck`), and the right-click menu (`useContextMenu`), then composes `TitleMenuBar`, `Toolbar`, `EditorCanvas` + `EditorPage` (the page-shaped editor surface), `StatusBar`, and various overlays (`FindReplaceBar`, `LinkPopover`, `SlashCommandPalette`, `KeyboardShortcutsModal`, `ContextMenu`, `QuickCorrect`, `ConflictBar`, `ToastContainer`).

State is React hooks + a single `DocumentContext`. No Redux/Zustand/etc.

### The editor: Tiptap extensions

`src/hooks/useEditorSetup.ts` is the single place the Tiptap editor is constructed. Adding new editor behavior almost always means writing or modifying a Tiptap extension in `src/extensions/`:

| File | Purpose |
|---|---|
| `Underline.ts`, `Spoiler.ts` | Custom marks |
| `MarkdownLink.ts` | Auto-linkifies URLs and handles `[text](url)` syntax |
| `BoldItalic.ts` | Input rules for `**bold**` / `*italic*` |
| `EscapeHandler.ts` | Custom Escape-key behavior |
| `ListIndent.ts` | Tab / Shift+Tab list nesting |
| `KeyboardShortcuts.ts` | Editor-scoped keybinds (file ops, formatting) |
| `ShiftNumberKeymap.ts` | Shift+digit shortcuts (e.g. headings) |
| `SlashCommands.ts` | `/`-triggered command palette |
| `SearchAndReplace.ts` | Find/replace with match highlighting |
| `Image.ts` | Inline image node (extends `@tiptap/extension-image`): broken-image placeholder node view, plus paste/drop of image files (embedded as `data:` URLs via `utils/imageFiles.ts`) |

Plus Tiptap's `StarterKit` and the official `link`, `underline`, `placeholder`, `gapcursor`, `table`, `table-row`, `table-header`, `table-cell` extensions.

Window-level keybinds (Ctrl+S, Ctrl+O, Ctrl+N, Ctrl+F, Ctrl+K, Shift+Ctrl+R) live in `App.tsx`'s global `keydown` handler. Editor-scoped binds live inside extensions.

### Markdown ↔ HTML pipeline

The editor stores content as ProseMirror/HTML internally; markdown only exists at the disk boundary:

- `src/utils/markdownImport.ts` — markdown → HTML when loading a file
- `src/utils/markdownExport.ts` — editor HTML → markdown when saving

Any new node/mark added to Tiptap must round-trip through both of these or it will be lost on save.

Images (`![alt](src "title")`, and linked badges `[![alt](src)](href)`) are parked in placeholders before the inline regexes run in `markdownImport`, so `_`/`*` inside image URLs aren't turned into emphasis. The image popover (`components/ImagePopover.tsx`) is opened from the toolbar, Insert menu and `/image` through `utils/imagePopover.ts`, not through App state.

`markdownToHtml` strips a leading UTF-8 BOM and normalizes CRLF/CR to LF before parsing; the block-level loops and their `(.+)$` regexes assume LF-only lines (a stray `\r` used to send the list and blockquote loops into an infinite-loop crash — keep the normalization if you touch this file). Soft-wrapped paragraph lines import as one `<p>` joined with `<br>`, which `markdownExport` writes back as plain newlines — this is what makes open→save round-trips preserve the original line wrapping.

### File system & conflict detection (`src/hooks/useFileSystem.ts`)

Three runtime modes, chosen once at module load: **Tauri** (`isTauri()`), **File System Access** (`showOpenFilePicker` exists), or **legacy fallback** (open via `<input type="file">`, save via blob download — no in-place saves, no watcher).

- **Tauri mode:** open/save dialogs via `@tauri-apps/plugin-dialog`, reads/writes via `@tauri-apps/plugin-fs`. External edits are detected by a push-based `watch()` (200ms debounce) — no polling, no typing pause; the app's own saves are suppressed with `selfWritingRef`. On launch via file association, the Rust command `get_initial_file_path` (`src-tauri/src/lib.rs`) returns a validated `argv[1]` path which a one-shot effect loads once the editor is ready.
- **Browser (FSA) mode:** `showOpenFilePicker` / `showSaveFilePicker`, and a polling watcher (every ~2s) that re-reads the open file's `lastModified`. It **pauses while the user is typing** (2s grace) and **while the tab is hidden** to keep CPU low.
- In both modes: if the file changed on disk *and* the editor has unsaved changes, `ConflictBar` is shown with reload/keep options. Don't bypass this.
- `beforeunload` is wired in `App.tsx` to warn on close when `isDirty`.

### Spellcheck (`src/hooks/useSpellcheck.ts`)

Uses **typo-js** with a Hunspell-style dictionary; runs as a **ProseMirror plugin** registered/unregistered dynamically by `App.tsx` (look for `editor.registerPlugin` / `unregisterPlugin('spellcheck$')`). Misspellings get a `.misspelled` class; clicking one opens `QuickCorrect`. The plugin includes per-word ignore and "add to dictionary" lists. Language is selectable from `TitleMenuBar`.

If you change the spellcheck plugin's key or signature, also update the registration check in `App.tsx` (`p.spec.key?.key === 'spellcheck$'`) and the unregister call.

## Things to know

- **Client-only and desktop-only.** There is no server side. The full web experience needs a File System Access API browser (Chrome/Edge); others get the legacy open/download fallback in `useFileSystem`. `DesktopGate` only enforces a minimum viewport width — API availability is handled per-call inside `useFileSystem`.
- **`src-tauri/`** holds the desktop shell: `main.rs` delegates to `lib.rs`, which registers the fs/dialog/log plugins and the single `get_initial_file_path` command. `tauri.conf.json` sets `devUrl` to port 5173 — which is why `vite.config.ts` uses `strictPort` (it honors a `PORT` env override for tooling but defaults to 5173).
- **`package.json` `name` is `"temp-scaffold"`** — leftover from the initial `create-vite` scaffold. Don't "fix" it without checking with the user; it's not consumed anywhere meaningful.
- **`handlePaste: false`** is set on the Tiptap editor and a custom `clipboardTextParser` splits on newlines into paragraphs. Pasted/dropped image *files* are handled separately by the `imageFiles` plugin in `extensions/Image.ts` (it defers to the normal HTML paste when the clipboard also has a web `<img>`). If you touch paste behavior, search for these.
- **CSS is split** into modular files imported from `App.tsx` (`chrome.css`, `overlays.css`, `editor.css`, `table.css`, `find-replace.css`, `context-menu.css`, `print.css`, `spellcheck.css`). There's no CSS-in-JS or PostCSS pipeline beyond what Vite does by default.
- **Visual design is "Raster"** (reference kit in `docs/style-reference/`). `src/index.css` holds the tokens (`--ground`, `--surface`, `--rule`, `--muted`, `--ink`, `--royal`, `--royal-300`…) and shared primitives: `.btn` (`-primary`/`-secondary`/`-ghost`), `.icon-btn`, `.field`, `.kbd`, `.meta`, and `.menu`/`.menu-item` used by every dropdown, context menu and palette. Rules: 0 radius everywhere; hover inverts fill and ink; press rings in `--royal`; focus is a `--royal-300` outline; floating surfaces lift on `--raised` + `--shadow-float` (no outlines); fonts are Schibsted Grotesk (UI and document) + JetBrains Mono (meta). Prefer these classes over inline styles. Tooltips are CSS-only: add `has-tip` + `data-tip="…"`.
- **Fonts are bundled, not fetched**: `@fontsource-variable/schibsted-grotesk` and `@fontsource/jetbrains-mono` are imported in `src/main.tsx` so the desktop app keeps its type offline. The variable package's family name is `Schibsted Grotesk Variable` (first in `--font-ui`). Don't add Google Fonts links back to `index.html`.
- **App icons** come from `public/favicon.svg`: `app-icon.png` (repo root, 1024px render of that SVG) is the input for `npx tauri icon`, which rewrites `src-tauri/icons/`. It also emits `android/`, `ios/` and `64x64.png`; this app is desktop-only, so delete those.
- **`.claude/launch.json`** points to dev server port 5173 with `autoPort` enabled — if 5173 is taken (e.g. another project's dev server), the Claude Preview tools assign a free port via the `PORT` env var, which `vite.config.ts` honors.
- **`.claude/settings.local.json`** has a permissions allowlist covering the npm/vite/tsc commands needed for this project.
- **`docs/superpowers/specs/`** holds brainstorming artifacts, not user-facing docs.
