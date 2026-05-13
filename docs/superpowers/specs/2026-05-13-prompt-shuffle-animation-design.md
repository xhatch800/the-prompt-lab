# Prompt Shuffle Animation — Design Spec

## Goal

When a new prompt is generated (initial load or ↺ regen), unlocked slots cycle rapidly through random values before decelerating and settling on the final word — a slot-machine effect. Locked slots remain static throughout.

## Scope

All changes in `index.html`. No new files, no external dependencies.

---

## Behaviour

### Trigger

The animation plays on every prompt generation:

- When the prompt screen first appears (Surreal Narrative or Mutations mode button tap)
- When the ↺ new prompt button is tapped
- When the Just Draw screen first appears
- When ↺ new prompt is tapped on Just Draw

### Per-mode details

**Surreal Narrative (4 slots: adjective · noun · verb · environment)**

- Unlocked slots animate simultaneously for 1.2s, decelerating as they approach the end
- Locked slots (padlock icon, terracotta border) stay completely still
- Each slot cycles through its own word pool (see table below)

**Mutations (2 slots: noun1 + noun2)**

- Same behaviour as Surreal Narrative — unlocked slots animate, locked stay still
- Each noun cycles through its assigned pool (`organic` or `synthetic`)

**Just Draw (single string)**

- The whole prompt element cycles through random `store.justDraw` strings for 1.2s, then settles

### Word pools during animation

| Slot | Cycles through |
|---|---|
| `adjective` | `store.adjectives` |
| `noun` | `store.nounsOrganic` + `store.nounsSynthetic` (combined) |
| `verb` | `store.verbs` |
| `environment` | `store.environments` |
| `noun1` | pool determined by `noun1Pool` on `currentPrompt` (`organic` or `synthetic`) |
| `noun2` | pool determined by `noun2Pool` on `currentPrompt` (`organic` or `synthetic`) |
| Just Draw | `store.justDraw` |

### Animation feel

- **Style**: slot-machine deceleration — starts fast (~55ms per frame), gradually slows after ~55% of duration, maximum interval ~320ms
- **Duration**: 1.2s (1200ms) per slot
- **All unlocked slots start simultaneously** — no stagger
- **Settlement**: slot snaps to final value and applies a brief scale-pop (`scale(1.18)` → `scale(1)` over 130ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`)

### Interaction guard

During animation, unlocked slots receive an `animating` CSS class:

```css
.prompt-slot.animating {
  pointer-events: none;
  cursor: default;
}
```

The class is removed when the slot settles, restoring tap-to-lock behaviour.

---

## Implementation

### New CSS

```css
.prompt-slot.animating {
  pointer-events: none;
  cursor: default;
}
```

### New JS functions

#### `animateSlot(el, pool, finalValue, durationMs)`

Drives deceleration for one slot element.

```js
function animateSlot(el, pool, finalValue, durationMs) {
  el.classList.add('animating');
  let elapsed = 0;
  let intervalTime = 55;

  function tick() {
    el.textContent = pick(pool);
    elapsed += intervalTime;
    if (elapsed > durationMs * 0.55) {
      intervalTime = Math.min(intervalTime * 1.22, 320);
    }
    if (elapsed >= durationMs) {
      el.textContent = finalValue;
      el.classList.remove('animating');
      // scale-pop
      el.style.transition = 'transform 0.13s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = 'scale(1.18)';
      setTimeout(() => { el.style.transform = 'scale(1)'; }, 130);
      return;
    }
    setTimeout(tick, intervalTime);
  }
  tick();
}
```

#### `animateUnlockedSlots(container, mode)`

Finds each unlocked `.prompt-slot` in the rendered container and animates it.

```js
function animateUnlockedSlots(container, mode) {
  const slotNames = mode === 'surreal'
    ? ['adjective', 'noun', 'verb', 'environment']
    : ['noun1', 'noun2'];

  const pools = {
    adjective:   store.adjectives,
    noun:        [...store.nounsOrganic, ...store.nounsSynthetic],
    verb:        store.verbs,
    environment: store.environments,
    noun1: currentPrompt.noun1Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic,
    noun2: currentPrompt.noun2Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic,
  };

  container.querySelectorAll('.prompt-slot:not(.locked)').forEach(span => {
    // data-slot attribute added by renderPrompt (see below)
    const slot = span.dataset.slot;
    const finalValue = currentPrompt[slot];
    animateSlot(span, pools[slot], finalValue, 1200);
  });
}
```

#### `animateJustDraw(el, finalValue)`

Animates the Just Draw single-string element.

```js
function animateJustDraw(el, finalValue) {
  animateSlot(el, store.justDraw, finalValue, 1200);
}
```

### `renderPrompt` change

Add `data-slot` attribute to each span so `animateUnlockedSlots` can identify which slot it corresponds to:

```js
span.dataset.slot = slot;   // add this line inside the forEach
```

### Call-site changes

**Initial Surreal Narrative load:**
```js
currentPrompt = generateSurrealNarrative(null, {});
showScreen('screen-imagine-prompt');
renderPrompt(container, 'surreal');
animateUnlockedSlots(container, 'surreal');
```

**Initial Mutations load:**
```js
currentPrompt = generateMutation(type, null, {});
showScreen('screen-imagine-prompt');
renderPrompt(container, 'mutations');
animateUnlockedSlots(container, 'mutations');
```

**↺ regen (imagine):**
```js
document.getElementById('btn-regen-imagine').addEventListener('click', () => {
  const container = document.getElementById('imagine-prompt');
  if (imagineMode === 'surreal') {
    currentPrompt = generateSurrealNarrative(currentPrompt, lockedSlots);
  } else {
    currentPrompt = generateMutation(mutationType, currentPrompt, lockedSlots);
  }
  renderPrompt(container, imagineMode);
  animateUnlockedSlots(container, imagineMode);
});
```

**Just Draw initial load:**
```js
document.getElementById('btn-just-draw').addEventListener('click', () => {
  const finalValue = generateJustDraw();
  const el = document.getElementById('just-draw-prompt');
  el.textContent = finalValue;
  showScreen('screen-just-draw');
  animateJustDraw(el, finalValue);
});
```

**↺ regen Just Draw:**
```js
document.getElementById('btn-regen-just-draw').addEventListener('click', () => {
  const finalValue = generateJustDraw();
  const el = document.getElementById('just-draw-prompt');
  el.textContent = finalValue;
  animateJustDraw(el, finalValue);
});
```

---

## Affected Code Paths

| Change | Location |
|---|---|
| `.prompt-slot.animating` CSS rule | `<style>` block |
| `animateSlot()` function | JS, new |
| `animateUnlockedSlots()` function | JS, new |
| `animateJustDraw()` function | JS, new |
| `data-slot` attribute on span | `renderPrompt()` |
| `animateUnlockedSlots()` call | Surreal initial load |
| `animateUnlockedSlots()` call | Mutations initial load |
| `animateUnlockedSlots()` call | `btn-regen-imagine` handler |
| `animateJustDraw()` call | `btn-just-draw` handler |
| `animateJustDraw()` call | `btn-regen-just-draw` handler |
