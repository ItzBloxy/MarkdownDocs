# MarkdownDocs — Phase 2: Rich Features Design

## Context

Phase 1 delivered the core editor: layout shell, TipTap with inline markdown conversion, block types, and state management. Phase 2 wires the UI to the editor — toolbar clicks, keyboard shortcuts, slash commands, and menu dropdowns become functional.

## Decisions

| Decision | Choice |
|----------|--------|
| Drag-and-drop | Removed from Phase 2 scope |
| Future menu items/shortcuts | Registered but disabled (grayed out, preventDefault) |
| Slash commands | TipTap suggestion extension + React renderer |
| Shift+number shortcuts | ProseMirror keymap plugin matching on `e.code` |

---

## 1. Toolbar Click Handlers

Each toolbar button gets an `onClick` calling the corresponding TipTap command.

**Inline marks:** `editor.chain().focus().toggleBold().run()` — same pattern for italic, underline, strike, code, spoiler.

**Block types:** `editor.chain().focus().toggleBulletList().run()` — same for ordered list, blockquote. HR uses `setHorizontalRule()`.

**Heading dropdown:** Real dropdown with options — Normal Text (`setParagraph()`), H1/H2/H3 (`toggleHeading({ level })`). Closes on selection and outside click.

**Undo/Redo:** `editor.chain().focus().undo().run()` / `.redo().run()`. Already have disabled state via `editor.can().undo()`.

**Code Block:** `editor.chain().focus().toggleCodeBlock().run()`

**Link button:** Opens a small popover with URL input. On submit: `editor.chain().focus().setLink({ href }).run()`. If text is selected, it becomes the link text. If link is active, popover shows current URL with option to edit or remove.

**Spoiler:** `editor.chain().focus().toggleMark('spoiler').run()`

---

## 2. Keyboard Shortcuts

Single TipTap extension registering all shortcuts.

### Active (Phase 2)

| Shortcut | Command |
|----------|---------|
| Mod-b | toggleBold |
| Mod-i | toggleItalic |
| Mod-u | toggleMark('underline') |
| Mod-Shift-x | toggleStrike |
| Mod-e | toggleCode |
| Mod-k | Open link popover |
| Mod-Shift-7 | toggleOrderedList (via e.code) |
| Mod-Shift-8 | toggleBulletList (via e.code) |
| Mod-Shift-9 | toggleBlockquote (via e.code) |
| Mod-z | undo (StarterKit) |
| Mod-Shift-z | redo (StarterKit) |
| Escape | Close open dropdown/palette/popover/modal |

### Registered but disabled

| Shortcut | Phase |
|----------|-------|
| Mod-s | 4 (Save) |
| Mod-Shift-s | 4 (Save As) |
| Mod-o | 4 (Open) |
| Mod-n | 4 (New) |
| Mod-Shift-r | 4 (Revert) |
| Mod-f | 3 (Find & Replace) |
| Mod-Shift-p | 4 (Preview) |

Disabled shortcuts preventDefault (block browser defaults) and show a brief "Coming soon" toast.

### Shift+number keys

Mod-Shift-7/8/9 use a ProseMirror keymap plugin matching `e.code` (Digit7/8/9) since `e.key` varies by keyboard layout when Shift is held.

### Keyboard Shortcuts Modal

Two-column grid modal opened from Help → Keyboard Shortcuts or the keyboard icon in the status bar. Groups: Formatting, Block Types, File, Navigation.

---

## 3. Slash Command Palette

Uses `@tiptap/suggestion` extension.

**Trigger:** `/` at the start of an empty paragraph.

**Commands:**

| Query | Icon | Label | Action | Status |
|-------|------|-------|--------|--------|
| text | Pilcrow | Text | setParagraph | Active |
| h1 | Heading1 | Heading 1 | toggleHeading(1) | Active |
| h2 | Heading2 | Heading 2 | toggleHeading(2) | Active |
| h3 | Heading3 | Heading 3 | toggleHeading(3) | Active |
| bullet | List | Bullet List | toggleBulletList | Active |
| numbered | ListOrdered | Numbered List | toggleOrderedList | Active |
| quote | Quote | Quote | toggleBlockquote | Active |
| code | Braces | Code Block | toggleCodeBlock | Active |
| table | Table2 | Table | — | Disabled (Phase 3) |
| divider | Minus | Divider | setHorizontalRule | Active |

**UI:** React component rendered via suggestion.render(). Positioned below cursor. Header "Blocks" in muted uppercase. Each row: 32x32 icon + label + description. Selected row highlighted. Arrow keys navigate, Enter selects, Escape closes. Dark theme styling.

**Files:** `src/extensions/SlashCommands.ts` + `src/components/SlashCommandPalette.tsx`

**Dependency:** `@tiptap/suggestion` (+ optionally `tippy.js` for positioning)

---

## 4. Menu Dropdowns

Reusable `MenuDropdown` component. Five menus with items, shortcuts, separators, and disabled states.

**File:** New, Open, Save, Save As, Download copy, Download .md, Revert, Unlink — all disabled (Phase 4).

**Edit:** Undo (active), Redo (active), Find & Replace (disabled Phase 3).

**Insert:** H1/H2/H3 (active), Bullet/Numbered/Blockquote/Code/HR (active), Table (disabled Phase 3).

**Format:** Bold/Italic/Underline/Strikethrough/Code (active), Link/Spoiler (active).

**Help:** Keyboard Shortcuts (active, opens modal).

**Behavior:** Click opens, click another switches, outside click or Escape closes. Disabled items grayed out.

**Files:** `src/components/MenuDropdown.tsx`, updated `src/components/TitleMenuBar.tsx`

---

## 5. New Files

| File | Purpose |
|------|---------|
| `src/extensions/SlashCommands.ts` | Suggestion extension config |
| `src/extensions/KeyboardShortcuts.ts` | All keyboard shortcuts + disabled future ones |
| `src/extensions/ShiftNumberKeymap.ts` | ProseMirror keymap for Mod-Shift-7/8/9 |
| `src/components/SlashCommandPalette.tsx` | Slash command popup renderer |
| `src/components/MenuDropdown.tsx` | Reusable dropdown menu component |
| `src/components/LinkPopover.tsx` | URL input popover for link creation |
| `src/components/KeyboardShortcutsModal.tsx` | Shortcuts reference modal |
| `src/components/Toast.tsx` | Brief "Coming soon" indicator for disabled shortcuts |

## 6. Modified Files

| File | Changes |
|------|---------|
| `src/components/Toolbar.tsx` | Add onClick handlers to all buttons, real heading dropdown |
| `src/components/TitleMenuBar.tsx` | Wire menu labels to MenuDropdown components |
| `src/components/StatusBar.tsx` | Wire keyboard icon to open shortcuts modal |
| `src/hooks/useEditorSetup.ts` | Add SlashCommands, KeyboardShortcuts, ShiftNumberKeymap extensions |
| `src/styles/editor.css` | Slash palette and dropdown styling |

---

## Verification

1. Click Bold with selection → bold. Same for Italic/Underline/Strike/Code/Spoiler.
2. Click heading dropdown → switches between Normal Text, H1, H2, H3.
3. Click Undo/Redo → history works.
4. Click Link → popover, enter URL → link created.
5. Click List/Quote/HR → block type changes.
6. Ctrl+B/I/U/Shift+X/E toggle formatting.
7. Ctrl+K opens link popover.
8. Ctrl+Shift+7/8/9 toggle list/quote.
9. Ctrl+S blocks browser save, shows "Coming soon".
10. `/` in empty block → palette appears. Filters, arrow nav, Enter selects.
11. Menu dropdowns open/close correctly. Disabled items grayed out.
12. Keyboard shortcuts modal opens from Help menu and status bar.
13. Escape closes all overlays.
14. Toolbar active states still update correctly.
