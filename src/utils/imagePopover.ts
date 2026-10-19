// Lets the toolbar, the Insert menu and the slash palette open the image
// popover without threading state through App. ImagePopoverHost registers
// the opener while it's mounted.
let opener: (() => void) | null = null

export function setImagePopoverOpener(fn: (() => void) | null) {
  opener = fn
}

export function openImagePopover() {
  opener?.()
}
