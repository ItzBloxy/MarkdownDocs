# MarkdownDocs — Phase 3: Tables & Find/Replace Design

## Context

Phase 2 delivered toolbar actions, keyboard shortcuts, slash commands, and menu dropdowns. Phase 3 adds the two remaining content features: tables as a first-class block type and find & replace.

## Decisions

| Decision | Choice |
|----------|--------|
| Table implementation | TipTap `@tiptap/extension-table` suite |
| Table styling | Light theme on white page (gray headers, subtle borders) |
| Table creation | Slash command + Insert menu (default 3×2, no grid picker) |
| Find & Replace | Custom ProseMirror plugin with decoration highlights |
| Replace cross-element | Known limitation — only single text node matches |

---

## 1. Tables

### Dependencies

`@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-header`, `@tiptap/extension-table-cell`

### Creation

- Slash command `/table` — enable the currently disabled command. Inserts 3×2 table.
- Insert → Table menu item — enable the disabled item. Inserts default 3×2.
- Markdown import — pipe-table parser creates TipTap table nodes (parser ready for Phase 4 file I/O).

### Styling (light theme)

- Header row: background `#f5f3f8`, font-weight 600, black text, bottom border 2px `#d0c8e0`
- Body cells: transparent background, black text, bottom border 1px `#e0dce6`
- Cell padding: 8px 12px
- Hover row: `#faf8fd` background tint
- Table outer border: 1px `#e0dce6`, border-radius 6px, overflow hidden
- Selected cell: 2px `var(--accent)` border
- Min cell width: 80px

### Cell Navigation (via @tiptap/extension-table)

- Tab → next cell (left→right, wraps rows). Last cell → new row.
- Shift+Tab → previous cell
- Enter → cell below (creates row if at bottom)
- Escape → deselect cell
- Arrow keys at cell edges → move between cells

### Table Manipulation — Floating Toolbar

Appears above the table when a cell is focused. Buttons:
- Add Column (right of current)
- Add Row (below current)
- Delete Column (removes table if last column)
- Delete Row (removes table if only header remains)
- Delete Table

Also: `+` button at right edge (add column) and bottom edge (add row) on hover.

### Markdown Serialization

**Export:** Pipe-table with column padding. Cell contents through htmlToMd.
**Import:** Detect pipe-table blocks, parse into table nodes. Inline markdown converted on load.

### New Files

- `src/styles/table.css` — table theme styling
- `src/components/TableToolbar.tsx` — floating manipulation toolbar

### Modified Files

- `src/hooks/useEditorSetup.ts` — add table extensions
- `src/extensions/SlashCommands.ts` / `src/components/SlashCommandPalette.tsx` — enable table command
- `src/components/TitleMenuBar.tsx` — enable Insert → Table menu item

---

## 2. Find & Replace

### UI — FindReplaceBar

Collapsible bar below toolbar, above editor canvas.

- Toggled by Ctrl+F or Edit → Find & Replace
- Find input (auto-focused) + match count ("3 of 12")
- Up/Down arrows to navigate matches
- "Replace" toggle expands second row: Replace input + Replace / Replace All buttons
- Close (X) or Escape dismisses and clears highlights

### Search Behavior

- Operates on textContent (not innerHTML), case-insensitive
- Search on every keystroke in find input
- Current match: stronger accent background. Other matches: lighter accent.
- Highlights are ProseMirror `Decoration.inline` — don't modify document, don't persist to export.

### Replace Behavior

- Replace: replace current match, advance to next
- Replace All: replace all matches in single transaction
- Only operates on single text node matches (known limitation)

### Implementation

- `src/extensions/SearchAndReplace.ts` — ProseMirror plugin: search state, decorations, commands (setSearchQuery, replaceMatch, replaceAll, nextMatch, prevMatch)
- `src/components/FindReplaceBar.tsx` — UI bar
- `src/styles/find-replace.css` — bar and highlight styling

### Modified Files

- `src/extensions/KeyboardShortcuts.ts` — enable Ctrl+F (remove comingSoon)
- `src/components/TitleMenuBar.tsx` — enable Edit → Find & Replace
- `src/hooks/useEditorSetup.ts` — add SearchAndReplace extension
- `src/App.tsx` — add FindReplaceBar component with open/close state

---

## Verification

1. `/table` inserts a 3×2 table with editable cells
2. Insert → Table menu creates a table
3. Tab moves between cells, wraps rows. Tab at last cell creates row.
4. Shift+Tab moves backward. Enter moves to cell below.
5. Inline markdown works in cells
6. Floating toolbar: Add/Delete Column/Row, Delete Table
7. `+` buttons on table edges
8. Deleting all columns/rows deletes the table
9. Light gray header, accent border on selected cell
10. Ctrl+F opens find bar
11. Typing highlights matches, shows count
12. Up/Down navigate matches
13. Replace replaces current and advances
14. Replace All replaces all
15. Escape/X clears highlights and closes bar
16. Highlights don't persist in export
