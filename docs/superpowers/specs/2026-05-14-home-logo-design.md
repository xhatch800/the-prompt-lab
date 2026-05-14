# Home Screen Logo — Design Spec

## Goal

Display the app logo above the title on the home screen.

## Scope

All changes in `index.html`. Logo asset already exists at `assets/drawing-prompt-lab-logo.png`.

---

## Option Chosen

**Option A — Logo above title, plain.**

The logo's cream circular background naturally blends with the app background (`#fdf8f0`). No drop shadow. The wallpaper sits at `z-index: 0` behind all screen content, so the logo appears over it with the wallpaper visible around the edges.

---

## HTML Change

In `screen-home`, add an `<img>` immediately before `<h1>`:

```html
<div id="screen-home" class="screen active">
  <img src="assets/drawing-prompt-lab-logo.png" alt="Drawing Prompt Lab logo" class="home-logo">
  <h1>Drawing Prompt Lab</h1>
  ...
</div>
```

---

## CSS

```css
.home-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 8px;
}
```

Responsive override for landscape / small screens (inside existing `@media (max-height: 500px)` block):

```css
.home-logo { width: 72px; height: 72px; }
```

---

## What Is NOT Changing

- Wallpaper layer — no changes
- `<h1>` text or styling
- Mode buttons
- All other screens
