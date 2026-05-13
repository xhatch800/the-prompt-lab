# Helpful Texts — Design Spec

## Goal

Add two types of non-invasive contextual hints to help users navigate the app and discover the lock/unlock feature.

## Scope

All changes in `index.html`. No new files, no external dependencies.

---

## Hint 1: Navigation Label

A small section label sits immediately to the right of every `←` back button on non-home screens. It names the current section in terracotta uppercase sans-serif — matching the app's existing accent colour.

### Screens and labels

| Screen | Label (static) |
|---|---|
| `screen-mutations-type` | "Strange Combinations" |
| `screen-just-draw` | "Sparks" |

| Screen | Label (dynamic) |
|---|---|
| `screen-imagine-prompt` | "Surreal Narratives" or "Strange Combinations" depending on `imagineMode` |

The `screen-imagine-prompt` label is set in JS each time the screen is shown (in the `btn-surreal` and `btn-type-*` handlers, and the `btn-regen-imagine` handler does not change the screen so no update needed there).

### Markup pattern

Each back button row becomes a flex container:

```html
<div class="back-row">
  <button class="back-btn" data-target="screen-home">←</button>
  <span class="screen-label">Strange Combinations</span>
</div>
```

For `screen-imagine-prompt`, the span gets an id so JS can update it:

```html
<div class="back-row">
  <button id="btn-back-imagine" class="back-btn">←</button>
  <span id="imagine-screen-label" class="screen-label"></span>
</div>
```

### CSS

```css
.back-row {
  display: flex;
  align-items: center;
  gap: 6px;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 10;
}

.screen-label {
  font-family: sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #b85c38;
}
```

The existing `.back-btn` has `position: fixed; top: 1rem; left: 1rem` in CSS. After wrapping it in `.back-row`, that fixed positioning must move to `.back-row` instead (so the label travels with the button). The `.back-btn` itself no longer needs `position: fixed` — it inherits layout from the flex row. Verify the existing `.back-btn` CSS rule and remove `position`, `top`, and `left` from it, replacing with the `.back-row` rule above.

---

## Hint 2: Lock Hint

A single always-visible line below the prompt on `screen-imagine-prompt` only. Sparks (`screen-just-draw`) has no lockable slots so it gets no lock hint.

### Markup

Added as a static `<p>` immediately after the `↺` regen button in `screen-imagine-prompt`:

```html
<p class="lock-hint">tap a word to lock it</p>
```

### CSS

```css
.lock-hint {
  font-family: sans-serif;
  font-size: 0.72rem;
  color: #bbb;
  text-align: center;
  margin-top: 12px;
  pointer-events: none;
}
```

`pointer-events: none` ensures the hint text never accidentally captures taps meant for prompt slots below it.

---

## JS changes

In the `btn-surreal` handler, after `showScreen(...)`:
```js
document.getElementById('imagine-screen-label').textContent = 'Surreal Narratives';
```

In each `btn-type-*` handler (the forEach), after `showScreen(...)`:
```js
document.getElementById('imagine-screen-label').textContent = 'Strange Combinations';
```

No other JS changes needed.

---

## What is NOT changing

- Back button behaviour and navigation logic
- Prompt generation, animation, locking
- Home screen
- Wallpaper
- All other CSS

---

## Affected locations in `index.html`

| Change | Location |
|---|---|
| `.back-row` + `.screen-label` CSS rules | `<style>` block |
| `.lock-hint` CSS rule | `<style>` block |
| Wrap back button in `.back-row` + add label | `screen-mutations-type` HTML |
| Wrap back button in `.back-row` + add label | `screen-just-draw` HTML |
| Wrap back button in `.back-row` + add `#imagine-screen-label` | `screen-imagine-prompt` HTML |
| Add `<p class="lock-hint">` | `screen-imagine-prompt` HTML |
| Set `imagine-screen-label` text | `btn-surreal` JS handler |
| Set `imagine-screen-label` text | `btn-type-*` JS forEach handler |
