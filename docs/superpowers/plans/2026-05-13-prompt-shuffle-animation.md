# Prompt Shuffle Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a prompt is generated (initial load or ↺ regen), unlocked slots cycle rapidly through random values with a slot-machine deceleration for 1.2s before settling on the final word; locked slots stay still throughout.

**Architecture:** Three new JS functions (`animateSlot`, `animateUnlockedSlots`, `animateJustDraw`) drive the animation entirely with `setTimeout` recursion — no CSS animations, no external libraries. A single CSS class (`animating`) disables pointer-events on spinning slots to prevent accidental lock-taps mid-animation. All changes are in `index.html`.

**Tech Stack:** Vanilla JS, CSS, single-file static app (no build step, no test runner — verification is manual browser testing via `python3 -m http.server 8080`)

---

## File Structure

| File | Change |
|---|---|
| `index.html` | All changes — CSS rule, 3 new JS functions, 1 `renderPrompt` tweak, 5 call-site updates |

---

## Context for implementer

This is a single-page app. All HTML, CSS, and JS live in `index.html`. Key functions you'll be touching:

- **`renderPrompt(container, mode)`** (line 739) — builds `.prompt-slot` spans from `currentPrompt`; you'll add `span.dataset.slot = slot` here.
- **`animateSlot` / `animateUnlockedSlots` / `animateJustDraw`** — new functions to add after `renderPrompt`.
- **Five event handlers** (lines 778–822) — each needs one `animateUnlockedSlots` or `animateJustDraw` call added after the existing `renderPrompt` call.

The word data lives in `store` (populated from JSON files at load time):
- `store.adjectives`, `store.verbs`, `store.environments`, `store.justDraw`
- `store.nounsOrganic`, `store.nounsSynthetic`

Locked slots carry class `locked` AND their text is preceded by a padlock SVG — do not animate them.
Unlocked slots have no `locked` class and expose `span.dataset.slot` (after Task 2).

To verify: open `http://localhost:8080` in a browser (run `python3 -m http.server 8080` from the project root).

---

### Task 1: Add `.prompt-slot.animating` CSS rule

**Files:**
- Modify: `index.html:185–188` (after `.prompt-slot.locked` rule)

- [ ] **Step 1: Add the CSS rule**

In `index.html`, locate the `.prompt-slot.locked` block (ends around line 188). Insert immediately after it:

```css
    .prompt-slot.animating {
      pointer-events: none;
      cursor: default;
    }
```

The full block after the edit should read:

```css
    .prompt-slot.locked {
      border-color: #b85c38;
      background: rgba(184, 92, 56, 0.12);
    }

    .prompt-slot.animating {
      pointer-events: none;
      cursor: default;
    }

    .prompt-sep {
      pointer-events: none;
      line-height: 1.5;
    }
```

- [ ] **Step 2: Verify in browser**

Run `python3 -m http.server 8080` from the project root. Open `http://localhost:8080`. Open DevTools console — no errors expected. Navigate to a prompt screen and confirm no visual change yet (the class doesn't exist anywhere yet).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add .prompt-slot.animating CSS rule"
```

---

### Task 2: Add `animateSlot()` and wire `data-slot` into `renderPrompt`

**Files:**
- Modify: `index.html:748` (`renderPrompt` — add `dataset.slot`)
- Modify: `index.html:759` (after `renderPrompt` closing brace — insert `animateSlot`)

- [ ] **Step 1: Add `data-slot` attribute in `renderPrompt`**

In `renderPrompt` (line 739), find this block inside the `slots.forEach`:

```js
        const span = document.createElement('span');
        span.className = 'prompt-slot' + (lockedSlots[slot] ? ' locked' : '');
        span.innerHTML = (lockedSlots[slot] ? LOCK_SVG : '') + currentPrompt[slot];
        span.addEventListener('click', () => toggleLock(slot, container, mode));
        container.appendChild(span);
```

Add `span.dataset.slot = slot;` after setting `className`:

```js
        const span = document.createElement('span');
        span.className = 'prompt-slot' + (lockedSlots[slot] ? ' locked' : '');
        span.dataset.slot = slot;
        span.innerHTML = (lockedSlots[slot] ? LOCK_SVG : '') + currentPrompt[slot];
        span.addEventListener('click', () => toggleLock(slot, container, mode));
        container.appendChild(span);
```

- [ ] **Step 2: Add `animateSlot` function after `renderPrompt`**

Immediately after the closing `}` of `renderPrompt` (after line 759), insert:

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

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8080`. Open DevTools console — no errors. The `animateSlot` function should be callable: paste `animateSlot(document.querySelector('.prompt-slot'), ['a','b','c'], 'done', 1200)` into the console while on a prompt screen and confirm the slot spins then settles. (If no prompt screen is visible yet, navigate to one first.)

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add animateSlot engine and data-slot attribute"
```

---

### Task 3: Add `animateUnlockedSlots` and `animateJustDraw`

**Files:**
- Modify: `index.html` — insert after `animateSlot` (Task 2)

- [ ] **Step 1: Add `animateUnlockedSlots` immediately after `animateSlot`**

```js
    function animateUnlockedSlots(container, mode) {
      const pools = {
        adjective:   store.adjectives,
        noun:        [...store.nounsOrganic, ...store.nounsSynthetic],
        verb:        store.verbs,
        environment: store.environments,
        noun1: currentPrompt.noun1Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic,
        noun2: currentPrompt.noun2Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic,
      };

      container.querySelectorAll('.prompt-slot:not(.locked)').forEach(span => {
        const slot = span.dataset.slot;
        animateSlot(span, pools[slot], currentPrompt[slot], 1200);
      });
    }
```

- [ ] **Step 2: Add `animateJustDraw` immediately after `animateUnlockedSlots`**

```js
    function animateJustDraw(el, finalValue) {
      animateSlot(el, store.justDraw, finalValue, 1200);
    }
```

- [ ] **Step 3: Verify in browser**

Reload. Open DevTools console. Navigate to a Surreal Narrative prompt. Paste into console:

```js
animateUnlockedSlots(document.getElementById('imagine-prompt'), imagineMode);
```

All unlocked slots should spin and settle. Locked slots should stay still. No console errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add animateUnlockedSlots and animateJustDraw orchestrators"
```

---

### Task 4: Wire animation into all five call sites

**Files:**
- Modify: `index.html:778–822` (five event handlers)

- [ ] **Step 1: Wire Just Draw initial load (line 778)**

Find:

```js
    document.getElementById('btn-just-draw').addEventListener('click', () => {
      document.getElementById('just-draw-prompt').textContent = generateJustDraw();
      showScreen('screen-just-draw');
    });
```

Replace with:

```js
    document.getElementById('btn-just-draw').addEventListener('click', () => {
      const finalValue = generateJustDraw();
      const el = document.getElementById('just-draw-prompt');
      el.textContent = finalValue;
      showScreen('screen-just-draw');
      animateJustDraw(el, finalValue);
    });
```

- [ ] **Step 2: Wire Just Draw regen (line 783)**

Find:

```js
    document.getElementById('btn-regen-just-draw').addEventListener('click', () => {
      document.getElementById('just-draw-prompt').textContent = generateJustDraw();
    });
```

Replace with:

```js
    document.getElementById('btn-regen-just-draw').addEventListener('click', () => {
      const finalValue = generateJustDraw();
      const el = document.getElementById('just-draw-prompt');
      el.textContent = finalValue;
      animateJustDraw(el, finalValue);
    });
```

- [ ] **Step 3: Wire Surreal Narrative initial load (line 791)**

Find:

```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-mode-picker';
      currentPrompt = generateSurrealNarrative(null, {});
      showScreen('screen-imagine-prompt');
      renderPrompt(document.getElementById('imagine-prompt'), 'surreal');
    });
```

Replace with:

```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-mode-picker';
      currentPrompt = generateSurrealNarrative(null, {});
      showScreen('screen-imagine-prompt');
      const container = document.getElementById('imagine-prompt');
      renderPrompt(container, 'surreal');
      animateUnlockedSlots(container, 'surreal');
    });
```

- [ ] **Step 4: Wire Mutations initial load (line 803)**

Find:

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

Replace with:

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
        animateUnlockedSlots(container, 'mutations');
      });
    });
```

- [ ] **Step 5: Wire regen (imagine) (line 814)**

Find:

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
      animateUnlockedSlots(container, imagineMode);
    });
```

- [ ] **Step 6: Verify all five triggers in browser**

Reload `http://localhost:8080`. Test each trigger:

1. **Just Draw load**: tap "Just draw!" → prompt should spin for ~1.2s then snap to final word
2. **Just Draw regen**: on Just Draw screen, tap ↺ → prompt spins again
3. **Surreal Narrative load**: tap "Can you imagine..." → "Surreal Narrative" → all 4 slots spin simultaneously, settle after ~1.2s
4. **Mutations load**: tap "Can you imagine..." → "Mutations" → pick any type → both slots spin
5. **Regen**: on any prompt screen, tap ↺ → unlocked slots spin, locked slots stay still
6. **Lock interaction guard**: while slots are spinning, try to tap one — it should not respond (pointer-events: none during animation)

Expected: all 6 checks pass, no console errors.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: wire shuffle animation into all prompt generation call sites"
```

---

## Self-Review

**Spec coverage:**
- ✅ Slot-machine deceleration (animateSlot with exponential slowdown)
- ✅ 1.2s duration
- ✅ All unlocked slots start simultaneously
- ✅ Locked slots untouched
- ✅ Scale-pop on settlement
- ✅ `animating` class disables pointer-events
- ✅ All 5 trigger points covered
- ✅ Word pools match spec table exactly
- ✅ Just Draw uses `store.justDraw` pool

**Placeholder scan:** No TBDs, no vague steps, all code blocks complete.

**Type consistency:** `animateSlot(el, pool, finalValue, durationMs)` signature used consistently across all callers. `animateUnlockedSlots(container, mode)` and `animateJustDraw(el, finalValue)` match their definitions exactly.
