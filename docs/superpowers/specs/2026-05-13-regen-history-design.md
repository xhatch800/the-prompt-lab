# Regeneration History — Design Spec

## Goal

Let users swipe back through the last 20 prompts they've generated in a session, using arrow + dot-trail navigation. History is per-screen-visit and cleared on exit.

## Scope

All changes in `index.html`. No new files, no external dependencies. Applies to all three prompt screens: Surreal Narratives, Strange Combinations, and Sparks.

---

## Data Model

Two new module-level variables alongside `currentPrompt`:

```js
const HISTORY_MAX = 20;
let promptHistory = [];  // array of prompt objects (same shape as currentPrompt)
let historyIndex = -1;   // -1 = empty; 0 = oldest; length-1 = newest
```

### History Lifecycle

| Event | Action |
|---|---|
| Enter any prompt screen | `promptHistory = []; historyIndex = -1` |
| Press ← on any prompt screen | `promptHistory = []; historyIndex = -1` |
| New prompt generated (initial or regen) | Truncate any forward entries (if mid-history). Push new prompt. Cap at `HISTORY_MAX` (shift oldest). Set `historyIndex = promptHistory.length - 1` |
| Navigate ‹ (older) | `historyIndex--`, restore prompt, no push |
| Navigate › (newer) | `historyIndex++`, restore prompt, no push |

**Regen while mid-history:** truncate entries ahead of current index, then push the new prompt. Matches browser history behaviour — going back and regenerating creates a new branch, discarding the forward entries.

**Lock state:** `promptHistory` stores full prompt objects (all word values). The locked/unlocked state of each slot is tracked separately and is never modified by history navigation — locked slots keep their styling, and restored words are reflected in unlocked slots only.

---

## Navigation Widget

### Placement

- `screen-imagine-prompt`: after `<p class="lock-hint">`, at the bottom of the screen
- `screen-just-draw`: after the regen button (no lock hint on Sparks)

Final layout for `screen-imagine-prompt`:
```
[ prompt slots ]
[ tap a word to lock it ]
[ ↺ new prompt ]
[ ‹  • • ● • •  › ]
```

Final layout for `screen-just-draw`:
```
[ prompt text ]
[ ↺ new prompt ]
[ ‹  • • ● • •  › ]
```

### HTML

`screen-imagine-prompt` (after lock-hint):
```html
<div class="history-nav" id="history-nav-imagine">
  <button class="hist-arrow" id="hist-prev-imagine">‹</button>
  <div class="hist-dots" id="hist-dots-imagine"></div>
  <button class="hist-arrow" id="hist-next-imagine">›</button>
</div>
```

`screen-just-draw` (after regen button):
```html
<div class="history-nav" id="history-nav-just-draw">
  <button class="hist-arrow" id="hist-prev-just-draw">‹</button>
  <div class="hist-dots" id="hist-dots-just-draw"></div>
  <button class="hist-arrow" id="hist-next-just-draw">›</button>
</div>
```

### CSS

```css
.history-nav {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  width: 100%;
}
.history-nav.visible { display: flex; }

.hist-arrow {
  font-family: 'Caveat', cursive;
  font-size: 1.8rem;
  color: #b85c38;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.hist-arrow:disabled { color: #ddd; cursor: default; }

.hist-dots { display: flex; gap: 5px; align-items: center; }
.hist-dot { width: 6px; height: 6px; border-radius: 50%; background: #ddd; }
.hist-dot.filled { background: #c9b9a8; }
.hist-dot.active { background: #b85c38; }
```

### Dot Rendering

- Widget hidden (`display: none`) when `promptHistory.length <= 1`
- Widget shown (`.visible`) when `promptHistory.length > 1`
- Up to **7 dots** visible — sliding window centred on `historyIndex` when history > 7
- Window start: `Math.max(0, Math.min(historyIndex - 3, promptHistory.length - 7))`
- Dot states: `active` = current, `filled` = past (index < historyIndex), empty = future
- ‹ arrow `disabled` when `historyIndex === 0`
- › arrow `disabled` when `historyIndex === promptHistory.length - 1`

---

## Slide Animation

Only the prompt container slides. All other UI (back button, regen, lock hint, history widget) stays fixed.

**Direction convention** (matches browser back/forward):
- ‹ older entry → new content enters from the **left**
- › newer entry → new content enters from the **right**

No slot-machine spin when restoring from history — the slide is the only animation.

### CSS

```css
@keyframes slideInFromLeft {
  from { transform: translateX(-50px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes slideInFromRight {
  from { transform: translateX(50px);  opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
.slide-from-left  { animation: slideInFromLeft  0.22s ease forwards; }
.slide-from-right { animation: slideInFromRight 0.22s ease forwards; }
```

---

## Helper Functions

| Function | Signature | Purpose |
|---|---|---|
| `clearHistory()` | `()` | `promptHistory = []; historyIndex = -1`; hides both widgets |
| `pushToHistory(prompt)` | `(prompt)` | Truncates forward entries, pushes, caps at `HISTORY_MAX`, updates `historyIndex` |
| `renderHistoryWidget(navId, dotsId, prevId, nextId)` | `(string, string, string, string)` | Redraws dots, enables/disables arrows, shows/hides widget |
| `navigateHistory(direction, promptContainerId, mode)` | `(-1 \| 1, string, string)` | Restores prompt, slides container, re-renders widget |

### `navigateHistory` detail

```js
function navigateHistory(direction, promptContainerId, mode) {
  historyIndex += direction;
  currentPrompt = promptHistory[historyIndex];

  const container = document.getElementById(promptContainerId);
  renderPrompt(container, mode);  // renderJustDraw equivalent for Sparks
  // NO animateUnlockedSlots — history restore is silent

  container.classList.remove('slide-from-left', 'slide-from-right');
  void container.offsetWidth;  // force reflow
  container.classList.add(direction === -1 ? 'slide-from-left' : 'slide-from-right');

  // ids are passed in or derived from promptContainerId
  const suffix = promptContainerId === 'imagine-prompt' ? 'imagine' : 'just-draw';
  renderHistoryWidget(
    `history-nav-${suffix}`,
    `hist-dots-${suffix}`,
    `hist-prev-${suffix}`,
    `hist-next-${suffix}`
  );
}
```

---

## JS Integration Points

| Trigger | Existing location | Change |
|---|---|---|
| Enter Surreal Narratives | `btn-surreal` click handler | `clearHistory()` before first prompt; `pushToHistory(currentPrompt)` after generation |
| Enter Strange Combinations | `btn-type-*` forEach handler | Same as above |
| Enter Sparks | `btn-just-draw` click handler | Same as above |
| ← on imagine-prompt | `btn-back-imagine` click handler | `clearHistory()` |
| ← on just-draw | `back-btn[data-target=screen-home]` on `screen-just-draw` | `clearHistory()` |
| Regen on imagine-prompt | `btn-regen-imagine` click handler | `pushToHistory(currentPrompt)` after generation; `renderHistoryWidget(...)` |
| Regen on just-draw | `btn-regen-just-draw` click handler | Same as above |
| ‹ arrow — imagine | New `hist-prev-imagine` click handler | `navigateHistory(-1, 'imagine-prompt', imagineMode)` |
| › arrow — imagine | New `hist-next-imagine` click handler | `navigateHistory(1, 'imagine-prompt', imagineMode)` |
| ‹ arrow — just-draw | New `hist-prev-just-draw` click handler | `navigateHistory(-1, 'just-draw-prompt', 'sparks')` |
| › arrow — just-draw | New `hist-next-just-draw` click handler | `navigateHistory(1, 'just-draw-prompt', 'sparks')` |

---

## What Is NOT Changing

- Prompt generation logic
- Slot-machine animation
- Locking / unlocking behaviour
- Back navigation routing (`promptBackTarget`)
- Home screen
- All other CSS
- `renderPrompt()` internals — called as-is, just without `animateUnlockedSlots` during history restore

---

## Affected Locations in `index.html`

| Change | Location |
|---|---|
| `HISTORY_MAX`, `promptHistory`, `historyIndex` vars | JS module-level declarations |
| `clearHistory()`, `pushToHistory()`, `renderHistoryWidget()`, `navigateHistory()` | New JS helper functions |
| `.history-nav`, `.hist-arrow`, `.hist-dots`, `.hist-dot` CSS | `<style>` block |
| `@keyframes slideInFromLeft/Right`, `.slide-from-left/right` CSS | `<style>` block |
| History nav widget HTML | `screen-imagine-prompt`, `screen-just-draw` |
| Hook into entry handlers | `btn-surreal`, `btn-type-*`, `btn-just-draw` JS handlers |
| Hook into back handlers | `btn-back-imagine`, back-btn on `screen-just-draw` JS handlers |
| Hook into regen handlers | `btn-regen-imagine`, `btn-regen-just-draw` JS handlers |
| New arrow click handlers | `hist-prev/next-imagine`, `hist-prev/next-just-draw` |
