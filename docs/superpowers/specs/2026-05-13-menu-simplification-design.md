# Menu Simplification — Design Spec

## Goal

Flatten the home screen from a two-level navigation (home → mode picker → prompt) to a single-level navigation (home → prompt). Rename awkward labels throughout.

## Scope

All changes in `index.html`. No new files, no external dependencies.

---

## Renames

| Location | Old text | New text |
|---|---|---|
| Home button | "Just draw!" | "Sparks" |
| Home button | "Can you imagine..." | *(deleted)* |
| Mode-picker button | "Surreal Narrative" | "Surreal Narratives" |
| Mode-picker button | "Mutations" | "Strange Combinations" |
| Mutations type-picker `<h2>` | "Mutations" | "Strange Combinations" |

---

## Structural changes

### Deleted: `screen-mode-picker`

The entire `<div id="screen-mode-picker">` block is removed. It contained the heading "Can you imagine..." and the two sub-mode buttons.

### Home screen (`screen-home`)

The two existing home buttons are replaced with three:

```html
<button id="btn-just-draw" class="mode-btn">Sparks</button>
<button id="btn-surreal" class="mode-btn">Surreal Narratives</button>
<button id="btn-mutations" class="mode-btn">Strange Combinations</button>
```

`btn-surreal` and `btn-mutations` move here from `screen-mode-picker`. Their element IDs and JS handlers are unchanged — only their parent element and label change.

### Navigation fixes

| Location | Old target | New target |
|---|---|---|
| Back button on `screen-mutations-type` (`data-target`) | `screen-mode-picker` | `screen-home` |
| `promptBackTarget` set in `btn-surreal` handler | `'screen-mode-picker'` | `'screen-home'` |
| Fallback in `btn-back-imagine` handler | `'screen-mode-picker'` | `'screen-home'` |

### Disabled-during-load

Currently `btn-just-draw` and `btn-imagine` are disabled while word data loads. Change to disable `btn-just-draw`, `btn-surreal`, and `btn-mutations` instead.

---

## What is NOT changing

- Prompt screens (`screen-just-draw`, `screen-imagine-prompt`)
- Strange Combinations type-picker (`screen-mutations-type`) and its four type buttons
- All animation code (`animateSlot`, `animateUnlockedSlots`, `animateJustDraw`)
- Lock/regen behaviour
- Wallpaper
- CSS (no style changes needed)

---

## Affected code locations in `index.html`

| Change | Location |
|---|---|
| Rename "Just draw!" → "Sparks" | Home screen HTML |
| Remove `btn-imagine` button | Home screen HTML |
| Add `btn-surreal` + `btn-mutations` to home screen | Home screen HTML |
| Delete `screen-mode-picker` block | HTML |
| Rename `<h2>` "Mutations" → "Strange Combinations" | `screen-mutations-type` HTML |
| Update `back-btn` `data-target` on mutations type-picker | `screen-mutations-type` HTML |
| Remove `btn-imagine` event listener | JS event wiring |
| Update `promptBackTarget` in `btn-surreal` handler | JS event wiring |
| Update fallback in `btn-back-imagine` handler | JS event wiring |
| Update disabled-during-load references | JS `init()` function |
