# MarkdownDocs — Phase 4+5: File I/O & Context Menu Design

## Context

Phase 3 delivered tables and find & replace. Phase 4+5 adds file operations (open/save with File System Access API), markdown conversion, live file watching, and a full right-click context menu system.

## Decisions

| Decision | Choice |
|----------|--------|
| Preview mode | Removed from scope |
| Page break indicators | Removed from scope |
| Block manipulation in context menu | Removed (Move/Duplicate/Delete) |
| Conflict resolution diff | Simplified: bulk Accept disk / Keep mine (no per-block merge) |

---

## Phase 4: File I/O

### useFileSystem Hook

Manages file handle state, watcher, and all file operations.

**State:** fileHandle (ref), lastModified, isLinked, watcherStatus ('linked' | 'paused' | 'unlinked')

**Operations:**
- **Open**: showOpenFilePicker → read → parse markdown → setContent. Fallback: hidden input[type=file]
- **Save**: handle.createWritable → serialize to markdown → write. Fallback: trigger Save As
- **Save As**: showSaveFilePicker → store handle → write
- **New**: confirm if dirty → clear document, release handle
- **Download Copy**: Blob download (.txt), doesn't affect handle
- **Download .md**: Blob download (.md)
- **Revert**: confirm → re-read from handle → replace document
- **Unlink**: release handle, stop watcher, keep content

### Markdown Conversion

**Import (markdownToHtml):** Line-by-line parser: `# ` → heading, `- ` → bullet list, `1. ` → ordered list, `> ` → blockquote, ``` → code block, `|...|` → table, `---` → hr, else paragraph. Inline markdown converted on load.

**Export (htmlToMarkdown):** Walk TipTap document tree. Convert marks to syntax (`<strong>` → `**`), prepend block prefixes, join with `\n`. Tables → pipe-table with column padding.

### Live File Watcher

- setInterval every 2s: `handle.getFile()`, compare lastModified
- Pause during typing (2s debounce), pause when tab hidden (visibilitychange)
- Clean doc + external change → auto-reload + toast
- Dirty doc + external change → conflict bar (Reload / Keep mine / Compare)

### Conflict Bar

Fixed bar at top of editor canvas. Three actions: Reload (load disk), Keep mine (ignore), Compare (simplified side-by-side modal with bulk accept).

### Status Bar File Link

- Linked: chain icon + "Linked" (green)
- Unlinked: "Local only" (muted)
- Paused: "Linked (paused)" (muted accent)

### Enable Disabled Shortcuts & Menu Items

Remove comingSoon from: Mod-s, Mod-Shift-s, Mod-o, Mod-n, Mod-Shift-r, Mod-Shift-p (keep Shift+P disabled since preview removed). Wire all File menu items.

### Print Styles

`@media print`: hide toolbar, menu bar, status bar, find bar. White bg, black text.

### Desktop-Only Gate

Viewport < 1024px: centered message "MarkdownDocs is designed for desktop browsers." Check on load + resize.

---

## Phase 5: Context Menu

### Architecture

- `ContextMenu` component rendered via `createPortal` to document.body
- State in App.tsx: `{ visible, x, y, context, targetEl }`
- Single `contextmenu` event listener on editor canvas (event delegation)

### Context Detection (priority order)

1. Inside `<a>` → link
2. Inside `<code>` (inline) → inline-code
3. Inside `.spoiler` → spoiler
4. Inside table → table-cell
5. Inside code block → code-block
6. Inside hr → hr
7. Non-collapsed selection → selection
8. Inside editable block → block
9. Canvas outside blocks → canvas

### Menu Contents

**selection:** Cut, Copy, Paste | Bold, Italic, Underline, Strikethrough, Code, Spoiler | Create Link | Look Up Selection

**block:** Paste | Turn Into → sub-menu

**link:** Open Link, Copy Link URL, Edit Link, Remove Link | block items

**inline-code:** Copy Code, Remove Formatting | block items

**spoiler:** Reveal/Re-hide/Remove Spoiler | block items

**code-block:** Copy All Code, Paste | Change Language → sub-menu

**table-cell:** Paste | Insert Column Right/Left, Insert Row Below/Above | Delete Column, Delete Row | Copy Table, Delete Table

**hr:** (minimal — just context identification, Turn Into disabled for hr)

**canvas:** Paste, Add Block Below

### Sub-Menus

**Turn Into:** Text, H1, H2, H3, Bullet List, Numbered List, Blockquote, Code Block. Disabled for hr/table.

**Change Language:** Text input filter + presets (javascript, typescript, python, html, css, json, bash, rust, go, sql, markdown, plain text). Active language shows check mark.

### Visual Design

- Background: `#18112a`, border 1px `#2a2044`, radius 10px, shadow
- Items: 7px 12px padding, 6px radius, hover `#261c3e`
- Shortcuts: right-aligned, muted, monospace 11px
- Dividers: 1px `#2a2044`, 4px vertical margin
- Animation: fade + scale 95→100% over 0.12s ease-out
- Viewport clamping: flip anchor if overflow right/bottom

### Active-State Awareness

Formatting items show check mark when cursor is inside corresponding format. Selecting toggles off.

### Clipboard

`navigator.clipboard.writeText/readText` with `document.execCommand` fallback. Copy Block/Table serializes to markdown.

### New Files

- `src/hooks/useFileSystem.ts`
- `src/utils/markdownImport.ts`
- `src/utils/markdownExport.ts`
- `src/components/ConflictBar.tsx`
- `src/components/DesktopGate.tsx`
- `src/components/ContextMenu.tsx`
- `src/components/SubMenu.tsx`
- `src/hooks/useContextMenu.ts`
- `src/styles/context-menu.css`
- `src/styles/print.css`

### Modified Files

- `src/App.tsx` — wire file system, context menu, conflict bar, desktop gate
- `src/components/TitleMenuBar.tsx` — enable all File menu items
- `src/components/StatusBar.tsx` — file link indicator
- `src/extensions/KeyboardShortcuts.ts` — enable all shortcuts
- `src/context/DocumentContext.tsx` — add fileHandle, watcherStatus

---

## Verification

1. Ctrl+O opens file, renders with formatting
2. Ctrl+S saves to linked file (no dialog)
3. Ctrl+Shift+S save picker, stores new handle
4. Ctrl+N clears after confirmation
5. Download Copy/Download .md work
6. Revert re-reads from disk
7. Unlink → "Local only"
8. External change → auto-reload (clean) or conflict bar (dirty)
9. Status bar shows Linked/Local only/Paused
10. .md file import renders headings, lists, code, tables
11. Export produces valid markdown
12. Desktop gate at <1024px
13. Print styles hide chrome
14. Right-click paragraph → block menu (Paste, Turn Into)
15. Right-click selection → formatting options + clipboard
16. Right-click link → Open, Copy URL, Edit, Remove
17. Right-click inline code → Copy Code, Remove Formatting
18. Right-click spoiler → Reveal/Hide/Remove
19. Right-click code block → Copy All Code, Change Language
20. Right-click table cell → row/column ops
21. Right-click canvas → Paste, Add Block
22. Turn Into converts preserving content
23. Change Language filters and sets lang
24. Active formatting shows check marks
25. Context menu clamped to viewport
26. Context menu closes on outside click, Escape, scroll
