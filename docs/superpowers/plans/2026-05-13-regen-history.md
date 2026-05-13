# Regeneration History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-session regeneration history (up to 20 entries) to all three prompt screens, navigable via ‹ › arrows and a dot-trail widget, with a slide animation on navigation.

**Architecture:** All changes in `index.html`. Four new JS helper functions manage the history array. CSS keyframes handle the slide-in animation. Two widget instances (one per prompt screen) are rendered by a shared `renderHistoryWidget()` function. History is cleared on entry to and exit from prompt screens.

**Tech Stack:** Vanilla JS, CSS, single-file static app. Verification is manual browser testing via `python3 -m http.server 8080`.

---

## File Structure

| File | Change |
|---|---|
| `index.html` | All changes — CSS rules, HTML widget divs, JS state + helpers + event wiring |

---

## Context for implementer

This is a single-page app. All HTML, CSS, and JS live in `index.html` (989 lines). Screens are `<div class="screen">` elements toggled by `showScreen(id)`. The three prompt screens are:

- `screen-just-draw` — Sparks. Prompt is a plain string set via `el.textContent`. No `currentPrompt` object used.
- `screen-imagine-prompt` — Surreal Narratives and Strange Combinations. Prompt is `currentPrompt` object, rendered by `renderPrompt(container, mode)`.

Key existing state (around line 871–875):
```js
let imagineMode = null;
let mutationType = null;
let promptBackTarget = null;
let currentPrompt = null;
let lockedSlots = {};
```

`showScreen(id)` at line 726 resets `currentPrompt` and `lockedSlots` when navigating to non-prompt screens. After Task 4 it will also call `clearHistory()` there.

The `lockedSlots` object tracks which prompt slots are pinned by the user. History navigation does NOT reset lockedSlots — locked slots keep their state. History stores full prompt objects (Surreal/Mutations) or plain strings (Sparks). On history restore, `renderPrompt` re-renders using `lockedSlots` to apply locked styling.

`pushToHistory` stores whatever the "current prompt value" is:
- For Sparks: a string (the word)
- For Surreal/Mutations: the `currentPrompt` object

Both live in the same `promptHistory` array. Since only one prompt screen is active at a time, the array always contains entries of one type per session.

---

### Task 1: CSS — history-nav widget and slide animation

**Files:**
- Modify: `index.html` — `<style>` block

- [ ] **Step 1: Add history-nav CSS and slide animation keyframes after `.lock-hint.animating`**

Find (around line 154):
```css
    .lock-hint.animating {
      opacity: 0;
    }
```

Replace with:
```css
    .lock-hint.animating {
      opacity: 0;
    }

    /* History navigation widget */
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

    /* History slide animation */
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

- [ ] **Step 2: Verify in browser**

Run `python3 -m http.server 8080` from the project root. Open `http://localhost:8080`. Open DevTools console — no errors expected. Visual appearance is identical to before (widgets hidden, animation classes not yet applied). No console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add history-nav widget CSS and slide animation keyframes"
```

---

### Task 2: HTML — add history widget divs to both prompt screens

**Files:**
- Modify: `index.html` — `screen-just-draw` and `screen-imagine-prompt` blocks

- [ ] **Step 1: Add history widget to `screen-just-draw` (after regen button)**

Find (around line 698):
```html
    <button id="btn-regen-just-draw" class="regen-btn">↺ new prompt</button>
  </div>

  <!-- Screen: Imagination Prompt -->
```

Replace with:
```html
    <button id="btn-regen-just-draw" class="regen-btn">↺ new prompt</button>
    <div class="history-nav" id="history-nav-just-draw">
      <button class="hist-arrow" id="hist-prev-just-draw">‹</button>
      <div class="hist-dots" id="hist-dots-just-draw"></div>
      <button class="hist-arrow" id="hist-next-just-draw">›</button>
    </div>
  </div>

  <!-- Screen: Imagination Prompt -->
```

- [ ] **Step 2: Add history widget to `screen-imagine-prompt` (after lock-hint)**

Find (around line 709):
```html
    <p id="lock-hint-imagine" class="lock-hint">tap a word to lock it</p>
  </div>
```

Replace with:
```html
    <p id="lock-hint-imagine" class="lock-hint">tap a word to lock it</p>
    <div class="history-nav" id="history-nav-imagine">
      <button class="hist-arrow" id="hist-prev-imagine">‹</button>
      <div class="hist-dots" id="hist-dots-imagine"></div>
      <button class="hist-arrow" id="hist-next-imagine">›</button>
    </div>
  </div>
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8080`. The history widgets are hidden by default (`display: none`). Navigate into Sparks and Surreal Narratives — no widget visible yet (JS not wired). No console errors. Back navigation still works.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add history-nav widget HTML to both prompt screens"
```

---

### Task 3: JS — state variables and helper functions

**Files:**
- Modify: `index.html` — JS `<script>` block

- [ ] **Step 1: Add history state variables after `lockedSlots`**

Find (around line 875):
```js
    let lockedSlots = {};      // e.g. { verb: true } — reset on back navigation
```

Replace with:
```js
    let lockedSlots = {};      // e.g. { verb: true } — reset on back navigation

    const HISTORY_MAX = 20;
    let promptHistory = [];    // string[] for Sparks; prompt object[] for Surreal/Mutations
    let historyIndex = -1;     // -1 = empty; 0 = oldest; length-1 = newest
```

- [ ] **Step 2: Add helper functions in a new section just before `// ── Event wiring`**

Find (around line 877):
```js
    // ── Event wiring ─────────────────────────────────────────────
```

Replace with:
```js
    // ── History helpers ──────────────────────────────────────────
    function clearHistory() {
      promptHistory = [];
      historyIndex = -1;
      document.getElementById('history-nav-imagine').classList.remove('visible');
      document.getElementById('history-nav-just-draw').classList.remove('visible');
    }

    function pushToHistory(prompt) {
      // Truncate any forward entries if mid-history (regen while browsing back)
      if (historyIndex < promptHistory.length - 1) {
        promptHistory = promptHistory.slice(0, historyIndex + 1);
      }
      promptHistory.push(prompt);
      if (promptHistory.length > HISTORY_MAX) {
        promptHistory.shift();
      }
      historyIndex = promptHistory.length - 1;
    }

    function renderHistoryWidget(navId, dotsId, prevId, nextId) {
      const nav = document.getElementById(navId);
      const dotsContainer = document.getElementById(dotsId);
      const prevBtn = document.getElementById(prevId);
      const nextBtn = document.getElementById(nextId);

      if (promptHistory.length <= 1) {
        nav.classList.remove('visible');
        return;
      }

      nav.classList.add('visible');

      // Sliding window of up to 7 dots centred on historyIndex
      const total = promptHistory.length;
      const maxDots = Math.min(total, 7);
      const windowStart = Math.max(0, Math.min(historyIndex - 3, total - 7));

      dotsContainer.innerHTML = '';
      for (let i = windowStart; i < windowStart + maxDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'hist-dot';
        if (i < historyIndex) dot.classList.add('filled');
        if (i === historyIndex) dot.classList.add('active');
        dotsContainer.appendChild(dot);
      }

      prevBtn.disabled = historyIndex === 0;
      nextBtn.disabled = historyIndex === promptHistory.length - 1;
    }

    function navigateHistory(direction, promptContainerId, mode) {
      historyIndex += direction;

      const container = document.getElementById(promptContainerId);

      if (mode === 'sparks') {
        container.textContent = promptHistory[historyIndex];
      } else {
        currentPrompt = promptHistory[historyIndex];
        renderPrompt(container, mode);
      }

      // Slide animation: going back (‹) = slide from left; going forward (›) = slide from right
      container.classList.remove('slide-from-left', 'slide-from-right');
      void container.offsetWidth; // force reflow so animation re-triggers
      container.classList.add(direction === -1 ? 'slide-from-left' : 'slide-from-right');

      const suffix = promptContainerId === 'imagine-prompt' ? 'imagine' : 'just-draw';
      renderHistoryWidget(
        `history-nav-${suffix}`,
        `hist-dots-${suffix}`,
        `hist-prev-${suffix}`,
        `hist-next-${suffix}`
      );
    }

    // ── Event wiring ─────────────────────────────────────────────
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8080`. Open DevTools console — no errors expected. `clearHistory`, `pushToHistory`, `renderHistoryWidget`, `navigateHistory` are defined (you can confirm by typing `clearHistory` in the console and seeing `ƒ clearHistory()`). No visual changes yet.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add history state variables and helper functions"
```

---

### Task 4: JS — wire all triggers and arrow handlers

**Files:**
- Modify: `index.html` — JS `<script>` block (5 existing handlers + 1 `showScreen` function + 4 new arrow handlers)

- [ ] **Step 1: Add `clearHistory()` to `showScreen` when leaving prompt screens**

Find (around line 731):
```js
      if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt') {
        currentPrompt = null;
        lockedSlots = {};
      }
```

Replace with:
```js
      if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt') {
        currentPrompt = null;
        lockedSlots = {};
        clearHistory();
      }
```

- [ ] **Step 2: Wire `btn-just-draw` — clear history on entry, push first prompt**

Find (around line 878):
```js
    document.getElementById('btn-just-draw').addEventListener('click', () => {
      const finalValue = generateJustDraw();
      const el = document.getElementById('just-draw-prompt');
      showScreen('screen-just-draw');
      el.textContent = finalValue;
      animateJustDraw(el, finalValue);
    });
```

Replace with:
```js
    document.getElementById('btn-just-draw').addEventListener('click', () => {
      clearHistory();
      const finalValue = generateJustDraw();
      const el = document.getElementById('just-draw-prompt');
      showScreen('screen-just-draw');
      el.textContent = finalValue;
      animateJustDraw(el, finalValue);
      pushToHistory(finalValue);
      renderHistoryWidget('history-nav-just-draw', 'hist-dots-just-draw', 'hist-prev-just-draw', 'hist-next-just-draw');
    });
```

- [ ] **Step 3: Wire `btn-regen-just-draw` — push each regen to history**

Find (around line 886):
```js
    document.getElementById('btn-regen-just-draw').addEventListener('click', () => {
      const finalValue = generateJustDraw();
      const el = document.getElementById('just-draw-prompt');
      el.textContent = finalValue;
      animateJustDraw(el, finalValue);
    });
```

Replace with:
```js
    document.getElementById('btn-regen-just-draw').addEventListener('click', () => {
      const finalValue = generateJustDraw();
      const el = document.getElementById('just-draw-prompt');
      el.textContent = finalValue;
      animateJustDraw(el, finalValue);
      pushToHistory(finalValue);
      renderHistoryWidget('history-nav-just-draw', 'hist-dots-just-draw', 'hist-prev-just-draw', 'hist-next-just-draw');
    });
```

- [ ] **Step 4: Wire `btn-surreal` — clear history on entry, push first prompt**

Find (around line 893):
```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-home';
      currentPrompt = generateSurrealNarrative(null, {});
      document.getElementById('imagine-screen-label').textContent = 'Surreal Narratives';
      showScreen('screen-imagine-prompt');
      const container = document.getElementById('imagine-prompt');
      renderPrompt(container, 'surreal');
      const hint = document.getElementById('lock-hint-imagine');
      hint.classList.add('animating');
      animateUnlockedSlots(container);
      setTimeout(() => hint.classList.remove('animating'), 1200);
    });
```

Replace with:
```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      clearHistory();
      imagineMode = 'surreal';
      promptBackTarget = 'screen-home';
      currentPrompt = generateSurrealNarrative(null, {});
      document.getElementById('imagine-screen-label').textContent = 'Surreal Narratives';
      showScreen('screen-imagine-prompt');
      const container = document.getElementById('imagine-prompt');
      renderPrompt(container, 'surreal');
      const hint = document.getElementById('lock-hint-imagine');
      hint.classList.add('animating');
      animateUnlockedSlots(container);
      setTimeout(() => hint.classList.remove('animating'), 1200);
      pushToHistory(currentPrompt);
      renderHistoryWidget('history-nav-imagine', 'hist-dots-imagine', 'hist-prev-imagine', 'hist-next-imagine');
    });
```

- [ ] **Step 5: Wire `btn-type-*` forEach — clear history on entry, push first prompt**

Find (around line 911):
```js
    ['organic-organic', 'organic-synthetic', 'synthetic-synthetic', 'random'].forEach(type => {
      document.getElementById(`btn-type-${type}`).addEventListener('click', () => {
        imagineMode = 'mutations';
        mutationType = type;  // 'random' stays 'random' — each regen re-rolls the concrete type
        promptBackTarget = 'screen-mutations-type';
        currentPrompt = generateMutation(type, null, {});
        document.getElementById('imagine-screen-label').textContent = 'Strange Combinations';
        showScreen('screen-imagine-prompt');
        const container = document.getElementById('imagine-prompt');
        renderPrompt(container, 'mutations');
        const hint = document.getElementById('lock-hint-imagine');
        hint.classList.add('animating');
        animateUnlockedSlots(container);
        setTimeout(() => hint.classList.remove('animating'), 1200);
      });
    });
```

Replace with:
```js
    ['organic-organic', 'organic-synthetic', 'synthetic-synthetic', 'random'].forEach(type => {
      document.getElementById(`btn-type-${type}`).addEventListener('click', () => {
        clearHistory();
        imagineMode = 'mutations';
        mutationType = type;  // 'random' stays 'random' — each regen re-rolls the concrete type
        promptBackTarget = 'screen-mutations-type';
        currentPrompt = generateMutation(type, null, {});
        document.getElementById('imagine-screen-label').textContent = 'Strange Combinations';
        showScreen('screen-imagine-prompt');
        const container = document.getElementById('imagine-prompt');
        renderPrompt(container, 'mutations');
        const hint = document.getElementById('lock-hint-imagine');
        hint.classList.add('animating');
        animateUnlockedSlots(container);
        setTimeout(() => hint.classList.remove('animating'), 1200);
        pushToHistory(currentPrompt);
        renderHistoryWidget('history-nav-imagine', 'hist-dots-imagine', 'hist-prev-imagine', 'hist-next-imagine');
      });
    });
```

- [ ] **Step 6: Wire `btn-regen-imagine` — push each regen to history**

Find (around line 928):
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
      const hint = document.getElementById('lock-hint-imagine');
      hint.classList.add('animating');
      animateUnlockedSlots(container);
      setTimeout(() => hint.classList.remove('animating'), 1200);
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
      const hint = document.getElementById('lock-hint-imagine');
      hint.classList.add('animating');
      animateUnlockedSlots(container);
      setTimeout(() => hint.classList.remove('animating'), 1200);
      pushToHistory(currentPrompt);
      renderHistoryWidget('history-nav-imagine', 'hist-dots-imagine', 'hist-prev-imagine', 'hist-next-imagine');
    });
```

- [ ] **Step 7: Add arrow click handlers after `btn-back-imagine` handler**

Find (around line 947):
```js
    document.getElementById('btn-back-imagine').addEventListener('click', () => {
      showScreen(promptBackTarget ?? 'screen-home');
    });
```

Replace with:
```js
    document.getElementById('btn-back-imagine').addEventListener('click', () => {
      showScreen(promptBackTarget ?? 'screen-home');
    });

    document.getElementById('hist-prev-imagine').addEventListener('click', () => {
      navigateHistory(-1, 'imagine-prompt', imagineMode);
    });
    document.getElementById('hist-next-imagine').addEventListener('click', () => {
      navigateHistory(1, 'imagine-prompt', imagineMode);
    });
    document.getElementById('hist-prev-just-draw').addEventListener('click', () => {
      navigateHistory(-1, 'just-draw-prompt', 'sparks');
    });
    document.getElementById('hist-next-just-draw').addEventListener('click', () => {
      navigateHistory(1, 'just-draw-prompt', 'sparks');
    });
```

- [ ] **Step 8: Verify full flow in browser**

Reload `http://localhost:8080`. Test each flow:

1. **Sparks — widget appears on second regen:**
   - Tap Sparks → first prompt, no widget visible ✓
   - Tap ↺ → second prompt, widget appears with 2 dots (● ○ → wait, newest is active: ○ ●) ✓
   - Tap ↺ twice more → 4 dots, current (rightmost/newest) is active (terracotta), others filled (muted) ✓
   - Tap ‹ → slide-from-left animation, previous prompt shown, › arrow enabled ✓
   - Tap › → slide-from-right animation, forward prompt shown ✓
   - Tap ‹ at oldest → ‹ arrow disabled (grey) ✓
   - Tap › at newest → › arrow disabled (grey) ✓
   - Tap ← (back to home) → widget gone, home shown ✓
   - Tap Sparks again → fresh start, no widget ✓

2. **Surreal Narratives — same widget behaviour, no slot animation on history nav:**
   - Tap Surreal Narratives → first prompt, no widget ✓
   - Tap ↺ several times → widget appears and grows ✓
   - Navigate history → prompt slots update instantly (no spin), slide animation plays ✓
   - Lock a word, tap ↺ → locked word stays, widget updates ✓
   - Navigate history while a word is locked → locked slot keeps its styling, unlocked slots show historical words ✓
   - Tap ← back → history cleared, type picker or home shown ✓
   - Return to Surreal Narratives → fresh history ✓

3. **Strange Combinations — same as Surreal:**
   - Pick any type → prompt screen, generate a few → widget appears ✓
   - History nav works, back clears history ✓

4. **Regen mid-history truncates forward:**
   - Generate 5 prompts (history: [1,2,3,4,5], index 4)
   - Navigate back twice (index 2, seeing prompt 3)
   - Tap ↺ → forward entries 4,5 discarded; new prompt appended → [1,2,3,new], index 3 ✓
   - › arrow now disabled (at newest) ✓

5. **No console errors** ✓

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: wire history triggers and arrow handlers for all prompt screens"
```

---

## Self-Review

**Spec coverage:**
- ✅ History applies to all 3 prompt screens (Tasks 2, 4)
- ✅ Max 20 entries — `HISTORY_MAX` + `shift()` in `pushToHistory` (Task 3)
- ✅ History cleared on entry to prompt screen — `clearHistory()` in each entry handler (Task 4 Steps 2, 4, 5)
- ✅ History cleared on exit from prompt screen — `clearHistory()` in `showScreen` (Task 4 Step 1)
- ✅ Locks stay as-is — `renderPrompt` uses `lockedSlots` which is never touched by history navigation (Task 3 `navigateHistory`)
- ✅ Option A navigation (‹ dots ›) — HTML + CSS (Tasks 1, 2)
- ✅ Layout order: slots → lock hint → regen → widget (Task 2)
- ✅ No lock hint on Sparks — widget placed after regen, no lock-hint in screen-just-draw (Task 2)
- ✅ Slide animation — keyframes + class toggle in `navigateHistory` (Tasks 1, 3)
- ✅ No slot-machine spin on history restore — `navigateHistory` never calls `animateUnlockedSlots` (Task 3)
- ✅ Regen while mid-history truncates forward entries — `slice` in `pushToHistory` (Task 3)
- ✅ Dot sliding window (7 max) — `renderHistoryWidget` (Task 3)
- ✅ Arrow disabled at edges — `prevBtn.disabled` / `nextBtn.disabled` in `renderHistoryWidget` (Task 3)
- ✅ Widget hidden until 2+ entries — `promptHistory.length <= 1` guard in `renderHistoryWidget` (Task 3)
