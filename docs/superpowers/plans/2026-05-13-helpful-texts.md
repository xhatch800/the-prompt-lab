# Helpful Texts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two non-invasive contextual hints — a section label next to every back button, and a permanent "tap a word to lock it" tip on the prompt screen.

**Architecture:** All changes in `index.html`. Task 1 adds CSS, Task 2 wraps back buttons in HTML and adds the lock hint, Task 3 wires the dynamic label in JS. No new files, no build step.

**Tech Stack:** Vanilla JS, CSS, single-file static app. Verification is manual browser testing via `python3 -m http.server 8080`.

---

## File Structure

| File | Change |
|---|---|
| `index.html` | All changes — CSS rules, HTML structure, JS label updates |

---

## Context for implementer

This is a single-page app. All HTML, CSS, and JS live in `index.html`. Screens are `<div class="screen">` elements; only one has class `active` at a time.

The app currently has these non-home screens (the ones that need a back button with a label):
- `screen-mutations-type` — Strange Combinations type picker, back → home
- `screen-just-draw` — Sparks prompt, back → home
- `screen-imagine-prompt` — Surreal Narratives or Strange Combinations prompt, back → varies

The `.back-btn` is currently `position: absolute` (main CSS) and `position: fixed` (inside a `@media` mobile override). After Task 1, that positioning moves to a new `.back-row` wrapper — the button itself becomes a non-positioned flex child.

---

### Task 1: CSS — add `.back-row`, `.screen-label`, `.lock-hint`; move positioning off `.back-btn`

**Files:**
- Modify: `index.html` — `<style>` block

- [ ] **Step 1: Update the `.back-btn` rule to remove positioning**

Find the `.back-btn` block (around line 108):
```css
    .back-btn {
      font-family: 'Caveat', cursive;
      font-size: 2rem;
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #2c2c2c;
      padding: 0.25rem 0.5rem;
      line-height: 1;
    }
```

Replace with (remove `position`, `top`, `left` — they move to `.back-row`):
```css
    .back-btn {
      font-family: 'Caveat', cursive;
      font-size: 2rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #2c2c2c;
      padding: 0.25rem 0.5rem;
      line-height: 1;
    }
```

- [ ] **Step 2: Add `.back-row`, `.screen-label`, and `.lock-hint` rules immediately after `.back-btn:hover`**

Find the `.back-btn:hover` block (around line 122):
```css
    .back-btn:hover {
      opacity: 0.6;
    }
```

Insert immediately after it:
```css
    .back-row {
      display: flex;
      align-items: center;
      gap: 6px;
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      z-index: 10;
    }

    .screen-label {
      font-family: sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #b85c38;
      pointer-events: none;
    }

    .lock-hint {
      font-family: sans-serif;
      font-size: 0.72rem;
      color: #bbb;
      text-align: center;
      margin-top: 12px;
      pointer-events: none;
    }
```

- [ ] **Step 3: Update the `@media` override for `.back-btn` to target `.back-row` instead**

Find the mobile media query override (around line 225):
```css
      .back-btn { position: fixed; font-size: 1.4rem; top: 1rem; left: 1rem; }
```

Replace with two rules (positioning moves to `.back-row`, only font-size stays on `.back-btn`):
```css
      .back-row { position: fixed; top: 1rem; left: 1rem; }
      .back-btn { font-size: 1.4rem; }
```

- [ ] **Step 4: Verify in browser**

Run `python3 -m http.server 8080` from the project root. Open `http://localhost:8080`. Open DevTools console — no errors expected. The home screen should look identical to before (no back buttons on home). No visual change yet.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add CSS for screen-label, lock-hint, and back-row positioning"
```

---

### Task 2: HTML — wrap back buttons in `.back-row`, add labels, add lock hint

**Files:**
- Modify: `index.html` — three screen blocks

- [ ] **Step 1: Update `screen-mutations-type` back button**

Find (around line 644):
```html
  <!-- Screen: Strange Combinations Type Picker -->
  <div id="screen-mutations-type" class="screen">
    <button class="back-btn" data-target="screen-home">←</button>
    <h2>Strange Combinations</h2>
```

Replace with:
```html
  <!-- Screen: Strange Combinations Type Picker -->
  <div id="screen-mutations-type" class="screen">
    <div class="back-row">
      <button class="back-btn" data-target="screen-home">←</button>
      <span class="screen-label">Strange Combinations</span>
    </div>
    <h2>Strange Combinations</h2>
```

- [ ] **Step 2: Update `screen-just-draw` back button**

Find (around line 656):
```html
  <!-- Screen: Just Draw Prompt -->
  <div id="screen-just-draw" class="screen">
    <button class="back-btn" data-target="screen-home">←</button>
    <p id="just-draw-prompt" class="prompt-text"></p>
```

Replace with:
```html
  <!-- Screen: Just Draw Prompt -->
  <div id="screen-just-draw" class="screen">
    <div class="back-row">
      <button class="back-btn" data-target="screen-home">←</button>
      <span class="screen-label">Sparks</span>
    </div>
    <p id="just-draw-prompt" class="prompt-text"></p>
```

- [ ] **Step 3: Update `screen-imagine-prompt` back button and add lock hint**

Find (around line 662):
```html
  <!-- Screen: Imagination Prompt -->
  <div id="screen-imagine-prompt" class="screen">
    <button id="btn-back-imagine" class="back-btn">←</button>
    <div id="imagine-prompt" class="prompt-text"></div>
    <button id="btn-regen-imagine" class="regen-btn">↺ new prompt</button>
  </div>
```

Replace with:
```html
  <!-- Screen: Imagination Prompt -->
  <div id="screen-imagine-prompt" class="screen">
    <div class="back-row">
      <button id="btn-back-imagine" class="back-btn">←</button>
      <span id="imagine-screen-label" class="screen-label"></span>
    </div>
    <div id="imagine-prompt" class="prompt-text"></div>
    <button id="btn-regen-imagine" class="regen-btn">↺ new prompt</button>
    <p class="lock-hint">tap a word to lock it</p>
  </div>
```

- [ ] **Step 4: Verify in browser**

Reload `http://localhost:8080`. Check each screen:

1. **Strange Combinations type picker** — ← button with "STRANGE COMBINATIONS" label to its right, top-left corner ✓
2. **Sparks prompt** — ← button with "SPARKS" label, top-left ✓
3. **Surreal Narratives prompt** — ← button with empty label (JS not wired yet), lock hint "tap a word to lock it" below the ↺ button ✓
4. **Strange Combinations prompt** — same as above ✓
5. No console errors ✓
6. Back buttons still navigate correctly ✓

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add back-row wrappers, screen labels, and lock hint to all screens"
```

---

### Task 3: JS — set `imagine-screen-label` text dynamically

**Files:**
- Modify: `index.html` — JS event handlers for `btn-surreal` and `btn-type-*`

- [ ] **Step 1: Update `btn-surreal` handler to set the label**

Find the `btn-surreal` handler (around line 850):
```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-home';
      currentPrompt = generateSurrealNarrative(null, {});
      showScreen('screen-imagine-prompt');
      const container = document.getElementById('imagine-prompt');
      renderPrompt(container, 'surreal');
      animateUnlockedSlots(container);
    });
```

Replace with:
```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-home';
      currentPrompt = generateSurrealNarrative(null, {});
      showScreen('screen-imagine-prompt');
      document.getElementById('imagine-screen-label').textContent = 'Surreal Narratives';
      const container = document.getElementById('imagine-prompt');
      renderPrompt(container, 'surreal');
      animateUnlockedSlots(container);
    });
```

- [ ] **Step 2: Update `btn-type-*` forEach handler to set the label**

Find the forEach handler (around line 864):
```js
    ['organic-organic', 'organic-synthetic', 'synthetic-synthetic', 'random'].forEach(type => {
      document.getElementById(`btn-type-${type}`).addEventListener('click', () => {
        imagineMode = 'mutations';
        mutationType = type;  // 'random' stays 'random' — each regen re-rolls the concrete type
        promptBackTarget = 'screen-mutations-type';
        currentPrompt = generateMutation(type, null, {});
        showScreen('screen-imagine-prompt');
        const container = document.getElementById('imagine-prompt');
        renderPrompt(container, 'mutations');
        animateUnlockedSlots(container);
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
        document.getElementById('imagine-screen-label').textContent = 'Strange Combinations';
        const container = document.getElementById('imagine-prompt');
        renderPrompt(container, 'mutations');
        animateUnlockedSlots(container);
      });
    });
```

- [ ] **Step 3: Verify all hints in browser**

Reload `http://localhost:8080`. Test each flow end-to-end:

1. **Sparks** → prompt screen shows "SPARKS" next to ← ✓
2. **Surreal Narratives** → prompt screen shows "SURREAL NARRATIVES" next to ← ✓, "tap a word to lock it" below regen button ✓
3. **Strange Combinations** → type picker shows "STRANGE COMBINATIONS" next to ← ✓ → pick any type → prompt screen shows "STRANGE COMBINATIONS" next to ← ✓, lock hint visible ✓
4. Tap a word on the Surreal Narratives prompt → it locks (terracotta + padlock) ✓
5. No console errors ✓

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: dynamically set imagine-screen-label for surreal and mutations modes"
```

---

## Self-Review

**Spec coverage:**
- ✅ Navigation label on `screen-mutations-type` — "Strange Combinations" (Task 2, Step 1)
- ✅ Navigation label on `screen-just-draw` — "Sparks" (Task 2, Step 2)
- ✅ Navigation label on `screen-imagine-prompt` — dynamic, "Surreal Narratives" or "Strange Combinations" (Task 2, Step 3 + Task 3)
- ✅ Lock hint on `screen-imagine-prompt` only — always visible (Task 2, Step 3)
- ✅ No lock hint on Sparks — not added
- ✅ `.back-btn` positioning moved to `.back-row` — (Task 1, Steps 1–3)
- ✅ Mobile `@media` override updated — (Task 1, Step 3)

**Placeholder scan:** No TBDs. All code blocks complete.

**Type consistency:** `imagine-screen-label` id used consistently in Task 2 HTML and Task 3 JS. `.back-row`, `.screen-label`, `.lock-hint` class names consistent across all tasks.
