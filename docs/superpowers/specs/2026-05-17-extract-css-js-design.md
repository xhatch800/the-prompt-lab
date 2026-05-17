# Extract CSS and JS from index.html — Design Spec

**Date:** 2026-05-17
**Feature:** Split single-file app into index.html + style.css + app.js

---

## Summary

Extract the inline `<style>` and `<script>` blocks from `index.html` into separate files. No logic changes — pure file split. Result is three files that work identically on GitHub Pages and the local python HTTP server.

---

## Files

| File | Before | After |
|---|---|---|
| `index.html` | ~2,597 lines (HTML + CSS + JS) | ~525 lines (HTML only) |
| `style.css` | does not exist | ~908 lines (CSS only) |
| `app.js` | does not exist | ~1,152 lines (JS only) |

---

## Changes

### `index.html`

- Remove the entire `<style>...</style>` block
- Add `<link rel="stylesheet" href="style.css">` in `<head>` in its place
- Remove the entire `<script>...</script>` block at the bottom of `<body>`
- Add `<script src="app.js" defer></script>` just before `</body>` in its place

### `style.css` (new)

- Verbatim contents of the `<style>` block — no changes to any rules

### `app.js` (new)

- Verbatim contents of the `<script>` block — no changes to any logic

---

## Constraints

- No build step — plain `<script src>` and `<link rel="stylesheet">` only
- Must work on GitHub Pages (static file serving)
- Must work with `python3 -m http.server 8080` locally
- `defer` attribute on `<script src="app.js">` ensures DOM is ready before JS runs (same timing as inline script at end of body)
- No logic changes, no refactoring, no behavior changes

---

## Verification

After the split:
- Home screen loads with all three mode buttons
- Everyday Life: prompt renders, filter works
- Strange Scenes: prompt renders, filter works
- Surreal Cauldron: config loads, generate works
- No console errors
