# Menu Button Icons — Design Spec

**Date:** 2026-05-17
**Feature:** Add a unicode glyph icon to each home-screen mode button

---

## Problem

The three home-screen buttons (`Everyday Life`, `Strange Scenes`, `Surreal Cauldron`) are text-only. A single icon per button adds visual character and makes each mode instantly distinguishable.

---

## Design

Add one unicode character before the label text of each button. No SVG, no CSS changes, no JavaScript changes — purely a text content change in `index.html`.

| Button | Icon | Character | Rationale |
|--------|------|-----------|-----------|
| Everyday Life | ☀ | U+2600 SUN | Daytime, ordinary life |
| Strange Scenes | ☯ | U+262F YIN YANG | Duality, the surreal within the mundane |
| Surreal Cauldron | ∞ | U+221E INFINITY | The combinatory / generative nature of the mode |

---

## Change

**File:** `index.html`

Replace:
```html
<button id="btn-just-draw" class="mode-btn">Everyday Life</button>
<button id="btn-strange-scenes" class="mode-btn" disabled>Strange Scenes</button>
<button id="btn-cauldron" class="mode-btn">✦ Surreal Cauldron</button>
```

With:
```html
<button id="btn-just-draw" class="mode-btn">☀ Everyday Life</button>
<button id="btn-strange-scenes" class="mode-btn" disabled>☯ Strange Scenes</button>
<button id="btn-cauldron" class="mode-btn">∞ Surreal Cauldron</button>
```

The existing `✦` prefix on the Cauldron button is replaced by `∞`.

---

## What Does NOT Change

- `css/style.css` — no changes
- `js/*.js` — no changes
- Button IDs, classes, disabled state — unchanged
- Layout, sizing, colours — unchanged
