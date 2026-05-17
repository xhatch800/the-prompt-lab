# Extract Wallpaper SVG from index.html — Design Spec

**Date:** 2026-05-17
**Feature:** Move the inline wallpaper SVG out of `index.html` into `assets/wallpaper.svg` and load it via CSS `background-image`

---

## Problem

`index.html` is 490 lines. Lines 16–409 are a single decorative SVG wallpaper, leaving the actual DOM structure (3 screens, buttons, script tags) buried in ~80 lines at the bottom. The file is hard to read and navigate.

---

## Goal

Reduce `index.html` to its DOM structure only (~90 lines) by extracting the wallpaper SVG into its own file and loading it as a CSS background. No behaviour changes.

---

## Approach

CSS `background-image` on `#wallpaper-layer`. The div already exists in the DOM and is referenced by JS to toggle the `dimmed` class — it stays. Only its SVG content moves out.

---

## Changes

### `assets/wallpaper.svg` — new file

Extract the `<svg>` element from `index.html` (currently lines 16–409) into this file. Remove the `width="100%"` and `height="100%"` attributes (sizing is handled by CSS). Keep `viewBox="0 0 420 900"` and `preserveAspectRatio="xMidYMid slice"`.

### `css/style.css` — add to `#wallpaper-layer` rule

```css
background-image: url(../assets/wallpaper.svg);
background-size: cover;
background-position: center;
```

### `index.html` — replace lines 14–411

Replace:
```html
  <!-- Wallpaper -->
  <div id="wallpaper-layer">
    <svg width="100%" height="100%" viewBox="0 0 420 900"
         preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">
      ... (393 lines of SVG) ...
    </svg>
  </div>
```

With:
```html
  <div id="wallpaper-layer"></div>
```

No other changes to `index.html`.

---

## What Does NOT Change

- `#wallpaper-layer` ID and its `dimmed` class toggle in JS — unchanged
- All existing `#wallpaper-layer` CSS rules (position, inset, z-index, opacity transition) — unchanged
- All screen divs, buttons, script tags in `index.html` — unchanged
- Visual appearance — identical
- GitHub Pages compatibility — CSS `background-image` with a relative URL works fine statically

---

## Result

| File | Before | After |
|------|--------|-------|
| `index.html` | 490 lines | ~90 lines |
| `assets/wallpaper.svg` | — | ~395 lines (new) |
| `css/style.css` | existing | +3 lines |
