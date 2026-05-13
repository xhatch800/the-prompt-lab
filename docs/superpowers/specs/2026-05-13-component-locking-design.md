# Component Locking — Design Spec

## Goal

Let users lock individual prompt components so only unlocked ones shuffle on regen. Applies to Surreal Narrative (4 slots) and Mutations (2 slots). Just Draw is unaffected.

## Scope

All changes are in `index.html` (HTML structure, CSS, JS). No new files, no dependencies.

---

## State Model

Two new variables alongside existing state:

```js
let currentPrompt = null;  // object holding current slot values (shape depends on mode)
let lockedSlots   = {};    // keys are slot names, value is true when locked
```

### Surreal Narrative shape

```js
currentPrompt = { adjective, noun, verb, environment }
```

### Mutations shape

```js
currentPrompt = { noun1, noun1Pool, noun2, noun2Pool }
// noun1Pool / noun2Pool: 'organic' | 'synthetic'
```

`noun1Pool` and `noun2Pool` are set on first generation and used for re-rolling unlocked slots.

---

## Generator Changes

### `generateSurrealNarrative(current, locked)`

- If `current` is `null` (first call), roll all 4 slots fresh.
- Otherwise, for each slot: keep the existing value if `locked[slot]` is `true`, otherwise pick a new value.
- Noun pool (organic vs synthetic) is re-rolled freely for unlocked noun slots.
- Returns a new `currentPrompt` object (never mutates in place).

### `generateMutation(type, current, locked)`

- If `current` is `null`, roll both nouns fresh; assign pools based on `type`.
  - `organic-organic`: both pools `'organic'`
  - `organic-synthetic`: `noun1Pool = 'organic'`, `noun2Pool = 'synthetic'`
  - `synthetic-synthetic`: both pools `'synthetic'`
  - `random`: roll a concrete type first, then assign pools accordingly
- On regen, for each noun slot:
  - If locked: keep existing word and pool.
  - If unlocked and type is not `'random'`: re-roll from the slot's assigned pool.
  - If unlocked and type is `'random'`: re-roll from a freshly random pool (organic or synthetic, 50/50).
- Returns a new `currentPrompt` object.

---

## Rendering

### HTML change

Replace `<p class="prompt-text">` on both prompt screens with `<div class="prompt-text">`.

Inside, render one `<span class="prompt-slot">` per component. Slots are separated by a light `·` separator (Surreal) or static ` + ` text (Mutations). Separators are not tappable.

### `renderPrompt(container, mode)`

Reads `currentPrompt` and `lockedSlots`. Clears `container`, then builds:

- For each slot: a `<span class="prompt-slot [locked]">` with the slot value
- If `lockedSlots[slot]` is true: add class `locked`, prepend the padlock SVG icon
- Each span has a click handler: `toggleLock(slotName)`

### `toggleLock(slot)`

```js
function toggleLock(slot) {
  if (lockedSlots[slot]) {
    delete lockedSlots[slot];
  } else {
    lockedSlots[slot] = true;
  }
  renderPrompt(container, mode);
}
```

### Regen change

`↺ new prompt` handlers call the updated generator (passing `currentPrompt` and `lockedSlots`), update `currentPrompt`, then call `renderPrompt()`.

---

## Visual Design

### Unlocked slot

Plain text, same size and colour as current prompt text. No border, no background.

### Locked slot

- Border: `2px solid #b85c38`
- Background: `rgba(184, 92, 56, 0.12)` (warm tint)
- Border radius: `8px`
- Padding: `0.25rem 0.8rem`
- Prepended padlock SVG: `16×18px`, stroked `#b85c38`, same weight as ↺ icon

### CSS additions

```css
.prompt-slot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  border-radius: 8px;
  padding: 0.25rem 0.5rem;
  transition: background 0.1s ease, border 0.1s ease;
}

.prompt-slot.locked {
  border: 2px solid #b85c38;
  background: rgba(184, 92, 56, 0.12);
  padding: 0.25rem 0.8rem;
}

.prompt-slot .lock-icon {
  flex-shrink: 0;
}
```

The separator spans (`.prompt-sep`) are `pointer-events: none` and carry no interactive styling.

---

## Lock Lifecycle

- **Reset:** `lockedSlots = {}` and `currentPrompt = null` any time `showScreen()` navigates away from a prompt screen to a non-prompt screen.
- **Persist:** Locks survive any number of regens on the same prompt screen.
- **Just Draw:** Unaffected — no slots, no locking. `currentPrompt` and `lockedSlots` are not touched by Just Draw flow.

---

## Affected Code Paths

| Change | Location |
|---|---|
| New state vars | JS `// ── State ──` block |
| `generateSurrealNarrative` updated | JS generators block |
| `generateMutation` updated | JS generators block |
| `renderPrompt()` added | JS new helper |
| `toggleLock()` added | JS new helper |
| Regen handlers updated | JS event wiring |
| `showScreen()` updated | JS screen management |
| `.prompt-slot`, `.prompt-slot.locked`, `.prompt-sep` | CSS |
| `<p>` → `<div>` on both prompt screens | HTML |
