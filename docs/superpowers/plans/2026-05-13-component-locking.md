# Component Locking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users tap individual prompt components to lock them, so only unlocked slots re-roll on regen — applied to Surreal Narrative (4 slots) and Mutations (2 slots).

**Architecture:** Introduce `currentPrompt` (object of current slot values) and `lockedSlots` (set of locked slot names) as session state. Generators change from returning strings to returning objects and accept current state + locks. A new `renderPrompt()` helper builds the prompt DOM from state; `toggleLock()` toggles a slot and re-renders. All changes are in `index.html`.

**Tech Stack:** Vanilla HTML/CSS/JS, no dependencies, no build step.

---

## File Map

| File | Action |
|---|---|
| `index.html` | Modify — CSS, state vars, helpers, generators, event handlers, one HTML tag |

---

### Task 1: Add CSS for prompt slots

**Files:**
- Modify: `index.html` (CSS `<style>` block)

- [ ] **Step 1: Add slot styles after the `.hidden` rule**

Find:
```css
    .hidden {
      display: none;
    }
```

Insert immediately after:
```css
    /* ── Prompt slots (locking) ── */
    .prompt-text {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 0.25rem;
    }

    .prompt-slot {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      border-radius: 8px;
      padding: 0.25rem 0.5rem;
      border: 2px solid transparent;
      transition: background 0.1s ease, border-color 0.1s ease;
    }

    .prompt-slot.locked {
      border-color: #b85c38;
      background: rgba(184, 92, 56, 0.12);
      padding: 0.25rem 0.8rem;
    }

    .prompt-sep {
      pointer-events: none;
      line-height: 1.5;
    }

    .lock-icon {
      flex-shrink: 0;
    }
```

- [ ] **Step 2: Verify CSS with static check**

```bash
python3 -c "
css = open('index.html').read()
checks = [
  ('prompt-slot', '.prompt-slot class'),
  ('prompt-slot.locked', '.locked modifier'),
  ('prompt-sep', '.prompt-sep class'),
  ('lock-icon', '.lock-icon class'),
  ('rgba(184, 92, 56, 0.12)', 'accent tint'),
]
for snippet, label in checks:
    assert snippet in css, f'MISSING: {label}'
    print(f'OK: {label}')
"
```

Expected:
```
OK: .prompt-slot class
OK: .locked modifier
OK: .prompt-sep class
OK: .lock-icon class
OK: accent tint
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add CSS for prompt slot locking"
```

---

### Task 2: Add state variables and reset on navigation

**Files:**
- Modify: `index.html` (JS `// ── State ──` block and `showScreen` function)

- [ ] **Step 1: Add two new state variables**

Find:
```js
    let imagineMode = null;    // 'surreal' | 'mutations'
    let mutationType = null;   // 'organic-organic' | 'organic-synthetic' | 'synthetic-synthetic' | 'random'
    let promptBackTarget = null;
```

Replace with:
```js
    let imagineMode = null;    // 'surreal' | 'mutations'
    let mutationType = null;   // 'organic-organic' | 'organic-synthetic' | 'synthetic-synthetic' | 'random'
    let promptBackTarget = null;
    let currentPrompt = null;  // { adjective, noun, verb, environment } | { noun1, noun1Pool, noun2, noun2Pool }
    let lockedSlots = {};      // e.g. { verb: true } — reset on back navigation
```

- [ ] **Step 2: Update `showScreen` to reset state when leaving a prompt screen**

Find:
```js
    function showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }
```

Replace with:
```js
    function showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt') {
        currentPrompt = null;
        lockedSlots = {};
      }
    }
```

- [ ] **Step 3: Verify with static check**

```bash
python3 -c "
js = open('index.html').read()
checks = [
  ('currentPrompt = null', 'currentPrompt state var'),
  ('lockedSlots = {}', 'lockedSlots state var'),
  ('screen-just-draw\' && id !== \'screen-imagine-prompt', 'reset guard in showScreen'),
]
for snippet, label in checks:
    assert snippet in js, f'MISSING: {label}'
    print(f'OK: {label}')
"
```

Expected:
```
OK: currentPrompt state var
OK: lockedSlots state var
OK: reset guard in showScreen
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add currentPrompt/lockedSlots state, reset on back nav"
```

---

### Task 3: Update `generateSurrealNarrative` to return an object and respect locks

**Files:**
- Modify: `index.html` (JS generators block)

- [ ] **Step 1: Replace `generateSurrealNarrative`**

Find and replace the entire function:

Old:
```js
    function generateSurrealNarrative() {
      const noun = Math.random() < 0.5
        ? pick(store.nounsOrganic)
        : pick(store.nounsSynthetic);
      return `${pick(store.adjectives)} ${noun} ${pick(store.verbs)} ${pick(store.environments)}`;
    }
```

New:
```js
    function generateSurrealNarrative(current, locked) {
      const prev = current || {};
      const adjective  = locked.adjective   ? prev.adjective   : pick(store.adjectives);
      const noun       = locked.noun        ? prev.noun        : (Math.random() < 0.5 ? pick(store.nounsOrganic) : pick(store.nounsSynthetic));
      const verb       = locked.verb        ? prev.verb        : pick(store.verbs);
      const environment = locked.environment ? prev.environment : pick(store.environments);
      return { adjective, noun, verb, environment };
    }
```

- [ ] **Step 2: Verify with static check**

```bash
python3 -c "
js = open('index.html').read()
checks = [
  ('generateSurrealNarrative(current, locked)', 'updated signature'),
  ('locked.adjective', 'adjective lock check'),
  ('locked.verb', 'verb lock check'),
  ('locked.environment', 'environment lock check'),
  ('return { adjective, noun, verb, environment }', 'returns object'),
]
for snippet, label in checks:
    assert snippet in js, f'MISSING: {label}'
    print(f'OK: {label}')
"
```

Expected:
```
OK: updated signature
OK: adjective lock check
OK: verb lock check
OK: environment lock check
OK: returns object
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: generateSurrealNarrative returns object and respects locks"
```

---

### Task 4: Update `generateMutation` to return an object and respect locks

**Files:**
- Modify: `index.html` (JS generators block)

- [ ] **Step 1: Replace `generateMutation`**

Find and replace the entire function:

Old:
```js
    function generateMutation(type) {
      const types = ['organic-organic', 'organic-synthetic', 'synthetic-synthetic'];
      const t = type === 'random' ? types[Math.floor(Math.random() * types.length)] : type;
      let n1, n2;
      if (t === 'organic-organic') {
        n1 = pick(store.nounsOrganic);
        n2 = pick(store.nounsOrganic);
      } else if (t === 'organic-synthetic') {
        n1 = pick(store.nounsOrganic);
        n2 = pick(store.nounsSynthetic);
      } else {
        n1 = pick(store.nounsSynthetic);
        n2 = pick(store.nounsSynthetic);
      }
      return `${n1} + ${n2}`;
    }
```

New:
```js
    function generateMutation(type, current, locked) {
      const prev = current || {};

      // Determine the target pool for each slot
      let pool1, pool2;
      if (type === 'random') {
        // In random mode, each unlocked slot draws from a freshly random pool
        pool1 = Math.random() < 0.5 ? 'organic' : 'synthetic';
        pool2 = Math.random() < 0.5 ? 'organic' : 'synthetic';
      } else if (type === 'organic-organic') {
        pool1 = 'organic';  pool2 = 'organic';
      } else if (type === 'organic-synthetic') {
        pool1 = 'organic';  pool2 = 'synthetic';
      } else { // synthetic-synthetic
        pool1 = 'synthetic'; pool2 = 'synthetic';
      }

      const noun1Pool = locked.noun1 ? prev.noun1Pool : pool1;
      const noun2Pool = locked.noun2 ? prev.noun2Pool : pool2;
      const noun1 = locked.noun1 ? prev.noun1 : pick(noun1Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic);
      const noun2 = locked.noun2 ? prev.noun2 : pick(noun2Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic);

      return { noun1, noun1Pool, noun2, noun2Pool };
    }
```

- [ ] **Step 2: Verify with static check**

```bash
python3 -c "
js = open('index.html').read()
checks = [
  ('generateMutation(type, current, locked)', 'updated signature'),
  ('locked.noun1', 'noun1 lock check'),
  ('locked.noun2', 'noun2 lock check'),
  ('noun1Pool', 'pool tracking'),
  ('return { noun1, noun1Pool, noun2, noun2Pool }', 'returns object'),
]
for snippet, label in checks:
    assert snippet in js, f'MISSING: {label}'
    print(f'OK: {label}')
"
```

Expected:
```
OK: updated signature
OK: noun1 lock check
OK: noun2 lock check
OK: pool tracking
OK: returns object
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: generateMutation returns object with pool tracking and respects locks"
```

---

### Task 5: Add `LOCK_SVG`, `renderPrompt`, and `toggleLock` helpers

**Files:**
- Modify: `index.html` (JS, after generators block, before state block)

- [ ] **Step 1: Insert helpers after the generators block**

Find:
```js
    // ── State ────────────────────────────────────────────────────
    let imagineMode = null;
```

Insert immediately before it:
```js
    // ── Prompt rendering ─────────────────────────────────────────
    const LOCK_SVG = '<svg class="lock-icon" width="16" height="18" viewBox="0 0 16 18" fill="none"><rect x="1" y="8" width="14" height="10" rx="2" stroke="#b85c38" stroke-width="2"/><path d="M4 8V6a4 4 0 0 1 8 0v2" stroke="#b85c38" stroke-width="2" stroke-linecap="round"/></svg>';

    function renderPrompt(container, mode) {
      container.innerHTML = '';
      const slots = mode === 'surreal'
        ? ['adjective', 'noun', 'verb', 'environment']
        : ['noun1', 'noun2'];
      const sep = mode === 'surreal' ? ' · ' : ' + ';

      slots.forEach((slot, i) => {
        const span = document.createElement('span');
        span.className = 'prompt-slot' + (lockedSlots[slot] ? ' locked' : '');
        span.innerHTML = (lockedSlots[slot] ? LOCK_SVG : '') + currentPrompt[slot];
        span.addEventListener('click', () => toggleLock(slot, container, mode));
        container.appendChild(span);
        if (i < slots.length - 1) {
          const s = document.createElement('span');
          s.className = 'prompt-sep';
          s.textContent = sep;
          container.appendChild(s);
        }
      });
    }

    function toggleLock(slot, container, mode) {
      if (lockedSlots[slot]) {
        delete lockedSlots[slot];
      } else {
        lockedSlots[slot] = true;
      }
      renderPrompt(container, mode);
    }

```

- [ ] **Step 2: Verify with static check**

```bash
python3 -c "
js = open('index.html').read()
checks = [
  ('LOCK_SVG', 'lock SVG constant'),
  ('stroke=\"#b85c38\"', 'accent colour on padlock'),
  ('function renderPrompt(container, mode)', 'renderPrompt signature'),
  ('function toggleLock(slot, container, mode)', 'toggleLock signature'),
  ('delete lockedSlots[slot]', 'unlock branch'),
  ('lockedSlots[slot] = true', 'lock branch'),
  ('prompt-sep', 'separator span'),
]
for snippet, label in checks:
    assert snippet in js, f'MISSING: {label}'
    print(f'OK: {label}')
"
```

Expected:
```
OK: lock SVG constant
OK: accent colour on padlock
OK: renderPrompt signature
OK: toggleLock signature
OK: unlock branch
OK: lock branch
OK: separator span
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add LOCK_SVG, renderPrompt, and toggleLock helpers"
```

---

### Task 6: Update HTML and event handlers

**Files:**
- Modify: `index.html` (one HTML tag + JS event wiring block)

- [ ] **Step 1: Change `<p>` to `<div>` on the Imagination Prompt screen**

Find:
```html
    <p id="imagine-prompt" class="prompt-text"></p>
```

Replace with:
```html
    <div id="imagine-prompt" class="prompt-text"></div>
```

*(The Just Draw `<p>` is unchanged — it still uses `textContent` as before.)*

- [ ] **Step 2: Update the `btn-surreal` handler**

Find:
```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-mode-picker';
      document.getElementById('imagine-prompt').textContent = generateSurrealNarrative();
      showScreen('screen-imagine-prompt');
    });
```

Replace with:
```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-mode-picker';
      currentPrompt = generateSurrealNarrative(null, {});
      showScreen('screen-imagine-prompt');
      renderPrompt(document.getElementById('imagine-prompt'), 'surreal');
    });
```

- [ ] **Step 3: Update the mutations type button handlers**

Find:
```js
    ['organic-organic', 'organic-synthetic', 'synthetic-synthetic', 'random'].forEach(type => {
      document.getElementById(`btn-type-${type}`).addEventListener('click', () => {
        imagineMode = 'mutations';
        mutationType = type;  // 'random' stays 'random' — each regen re-rolls the concrete type
        promptBackTarget = 'screen-mutations-type';
        document.getElementById('imagine-prompt').textContent = generateMutation(type);
        showScreen('screen-imagine-prompt');
      });
    });
```

Replace with:
```js
    ['organic-organic', 'organic-synthetic', 'synthetic-synthetic', 'random'].forEach(type => {
      document.getElementById(`btn-type-${type}`).addEventListener('click', () => {
        imagineMode = 'mutations';
        mutationType = type;  // 'random' stays 'random' — each regen re-rolls the concrete type
        promptBackTarget = 'screen-mutations-type';
        currentPrompt = generateMutation(type, null, {});
        showScreen('screen-imagine-prompt');
        renderPrompt(document.getElementById('imagine-prompt'), 'mutations');
      });
    });
```

- [ ] **Step 4: Update the `btn-regen-imagine` handler**

Find:
```js
    document.getElementById('btn-regen-imagine').addEventListener('click', () => {
      if (!imagineMode) return;
      document.getElementById('imagine-prompt').textContent =
        imagineMode === 'surreal' ? generateSurrealNarrative() : generateMutation(mutationType);
    });
```

Replace with:
```js
    document.getElementById('btn-regen-imagine').addEventListener('click', () => {
      if (!imagineMode) return;
      const container = document.getElementById('imagine-prompt');
      if (imagineMode === 'surreal') {
        currentPrompt = generateSurrealNarrative(currentPrompt, lockedSlots);
      } else {
        currentPrompt = generateMutation(mutationType, currentPrompt, lockedSlots);
      }
      renderPrompt(container, imagineMode);
    });
```

- [ ] **Step 5: Verify with static check**

```bash
python3 -c "
html = open('index.html').read()
checks = [
  ('<div id=\"imagine-prompt\" class=\"prompt-text\"></div>', 'div not p for imagine-prompt'),
  ('generateSurrealNarrative(null, {})', 'surreal first call'),
  ('generateMutation(type, null, {})', 'mutations first call'),
  ('generateSurrealNarrative(currentPrompt, lockedSlots)', 'surreal regen call'),
  ('generateMutation(mutationType, currentPrompt, lockedSlots)', 'mutations regen call'),
  ('renderPrompt(document.getElementById(\'imagine-prompt\')', 'renderPrompt called'),
]
for snippet, label in checks:
    assert snippet in html, f'MISSING: {label}'
    print(f'OK: {label}')
"
```

Expected:
```
OK: div not p for imagine-prompt
OK: surreal first call
OK: mutations first call
OK: surreal regen call
OK: mutations regen call
OK: renderPrompt called
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: wire component locking into HTML and event handlers"
```

---

### Task 7: Manual end-to-end verification

**Files:** none (browser testing)

- [ ] **Step 1: Start local server**

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

- [ ] **Step 2: Surreal Narrative — basic lock**

Home → "Can you imagine..." → "Surreal Narrative". Confirm 4 separate tappable words appear with `·` separators.

Tap the **verb** word. Confirm it gets the accent border + tint + padlock icon. Tap "↺ new prompt" 5 times — the verb must stay the same every time; the other 3 words change.

- [ ] **Step 3: Surreal Narrative — multiple locks**

Tap **adjective** and **environment** as well (3 slots locked). Regen several times — only the noun changes.

- [ ] **Step 4: Surreal Narrative — unlock**

Tap the locked verb again. Confirm it loses the lock styling. Regen — verb now shuffles.

- [ ] **Step 5: Surreal Narrative — back resets locks**

Lock any slot. Tap ← back to Mode Picker. Tap "Surreal Narrative" again. Confirm no slots are locked and the prompt is fully fresh.

- [ ] **Step 6: Mutations — organic + synthetic, lock one noun**

Home → "Can you imagine..." → "Mutations" → "Organic + Synthetic". Tap the first noun (organic) to lock it. Regen several times — first noun stays; second noun changes and should always be from the synthetic list (creatures, plants, people vs tools, objects, structures).

- [ ] **Step 7: Mutations — random type, lock one noun**

Home → "Can you imagine..." → "Mutations" → "Random". Lock one noun. Regen several times — locked noun stays; unlocked noun changes and may be from either pool (organic or synthetic).

- [ ] **Step 8: Just Draw — unaffected**

Home → "Just draw!" — confirm prompt still renders as plain text with no slot spans or lock controls. Regen works as before.

- [ ] **Step 9: Mobile (landscape) — slots wrap cleanly**

Rotate device or use DevTools 375px viewport in landscape. Confirm slots wrap to multiple lines and lock styling is still visible and tappable.
