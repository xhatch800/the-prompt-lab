# Whimsical Wallpaper — Design Spec

## Goal

Add a subtle illustrated wallpaper to Drawing Prompt Lab: scattered hand-drawn doodles fixed behind all screens, reinforcing the sketchbook personality of the app.

## Scope

All changes in `index.html`. No new files, no external dependencies.

---

## Visual Design

### Object Set

The following SVG doodle objects are scattered across the background:

| Object | Colour |
|---|---|
| Pencils (×2, different angles) | `#2c2c2c` |
| Gears (×2, different sizes) | `#2c2c2c` |
| Pocket watch (with chain and crown) | `#b85c38` |
| Wall clock | `#2c2c2c` |
| Unicorn head (with horn and mane) | `#2c2c2c` + `#b85c38` |
| Dragon (with wing, spines, flame) | `#2c2c2c` + `#b85c38` |
| Hourglass (with accent sand) | `#2c2c2c` + `#b85c38` |
| Key | `#2c2c2c` |
| Mushroom (with accent spots) | `#2c2c2c` + `#b85c38` |
| Crystal / gem (diamond shape) | `#b85c38` |
| Floating eye (with lashes) | `#2c2c2c` |
| Lightning bolt | `#b85c38` |
| Potion bottle (with liquid and bubbles) | `#2c2c2c` + `#b85c38` |
| Magnifying glass | `#2c2c2c` |
| Crown | `#b85c38` |
| Butterfly | `#b85c38` |
| Feather | `#2c2c2c` |
| Quill | `#2c2c2c` |
| Comet (with tail streaks) | `#b85c38` |
| Crescent moon | `#b85c38` |
| Spirals (×2) | `#2c2c2c` |
| Stars / sparkles (✦ ✧, scattered) | `#b85c38` + `#2c2c2c` |
| Wavy doodle lines (×3) | `#2c2c2c` |

### Colour Usage

Objects use only the two existing app colours — no new colours introduced:
- `#2c2c2c` (near-black) — structural objects: pencils, gears, clock, key, feather, quill, eye, magnifying glass
- `#b85c38` (terracotta accent) — magical/accent objects: pocket watch, crystal, crown, butterfly, lightning, comet, moon; accent details on dragon, unicorn, hourglass, mushroom, potion

### Opacity

| Context | Opacity |
|---|---|
| All screens except prompt | `0.22` |
| Prompt screen (`screen-imagine-prompt`) | `0.12` |

Transition between states: `opacity 0.3s ease`.

The reduced opacity on the prompt screen ensures the large prompt words (and their lock/unlock styling) remain the visual focus.

---

## Implementation

### HTML

Insert one new element as the **first child of `<body>`**, before all `.screen` divs:

```html
<div id="wallpaper-layer">
  <svg width="100%" height="100%" viewBox="0 0 420 900"
       preserveAspectRatio="xMidYMid slice"
       xmlns="http://www.w3.org/2000/svg">
    <!-- all doodle objects here -->
  </svg>
</div>
```

`preserveAspectRatio="xMidYMid slice"` gives CSS `background-size: cover` behaviour — the SVG scales up to fill any viewport, always covering the full screen. Objects near the very edges may be slightly cropped on wide/landscape viewports; central objects are always visible.

### CSS

Add to the `<style>` block:

```css
/* ── Wallpaper ── */
#wallpaper-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.22;
  transition: opacity 0.3s ease;
}

#wallpaper-layer.dimmed {
  opacity: 0.12;
}
```

All existing `.screen` elements already have `position: fixed` — add `z-index: 1` to `.screen` in the existing rule so screens render above the wallpaper layer.

### JS — `showScreen()` change

In the existing `showScreen(id)` function, add one line to toggle the `dimmed` class:

```js
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // dim wallpaper on prompt screen so words stay legible
  document.getElementById('wallpaper-layer')
    .classList.toggle('dimmed', id === 'screen-imagine-prompt');
  if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt') {
    currentPrompt = null;
    lockedSlots = {};
  }
}
```

### SVG Object Layout

Objects are placed across the `0 0 420 900` coordinate space (portrait phone proportions). Distribution target:

| Zone | y range | Objects |
|---|---|---|
| Top strip | 0–160 | pencil, crescent moon, large gear, pocket watch, comet, small gear, star sparkles |
| Upper-middle | 160–320 | unicorn (left), hourglass (centre), key (centre-right), dragon (right), crown, quill |
| Middle | 320–560 | mushroom, crystal, floating eye, lightning bolt, feather, butterfly, spiral, wavy lines |
| Lower | 560–750 | small gear, potion bottle, pencil, magnifying glass, wall clock |
| Bottom strip | 750–900 | stars, wavy doodle lines |

---

## Affected Code Paths

| Change | Location |
|---|---|
| `#wallpaper-layer` div + inline SVG | HTML `<body>` (first child) |
| `#wallpaper-layer`, `#wallpaper-layer.dimmed` rules | CSS `<style>` block |
| `z-index: 1` on `.screen` | CSS, existing `.screen` rule |
| `classList.toggle('dimmed', ...)` | JS `showScreen()` function |
