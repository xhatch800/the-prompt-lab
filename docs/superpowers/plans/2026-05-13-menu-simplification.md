# Menu Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the home screen to three direct buttons (Sparks, Surreal Narratives, Strange Combinations), eliminating the intermediate mode-picker screen entirely.

**Architecture:** All changes are in `index.html` — two tasks, HTML first then JS. No new files, no build step.

**Tech Stack:** Vanilla JS, single-file static app. Verification is manual browser testing via `python3 -m http.server 8080`.

---

## File Structure

| File | Change |
|---|---|
| `index.html` | All changes — HTML restructure, JS handler updates |

---

## Context for implementer

This is a single-page app. All HTML, CSS, and JS live in `index.html`. The navigation is driven by `showScreen(id)` which toggles a `.active` class on `<div class="screen">` elements.

Current home screen has 2 buttons: `btn-just-draw` and `btn-imagine`. The `btn-imagine` button leads to `screen-mode-picker`, which contains `btn-surreal` and `btn-mutations`.

After these changes, the home screen has 3 buttons: `btn-just-draw`, `btn-surreal`, and `btn-mutations`. The `screen-mode-picker` screen is gone entirely.

---

### Task 1: HTML changes

**Files:**
- Modify: `index.html` (home screen, mode-picker block, mutations type-picker)

- [ ] **Step 1: Update the home screen buttons**

Find (lines 636–639):
```html
    <div class="mode-buttons">
      <button id="btn-just-draw" class="mode-btn">Just draw!</button>
      <button id="btn-imagine" class="mode-btn">Can you imagine...</button>
    </div>
```

Replace with:
```html
    <div class="mode-buttons">
      <button id="btn-just-draw" class="mode-btn">Sparks</button>
      <button id="btn-surreal" class="mode-btn">Surreal Narratives</button>
      <button id="btn-mutations" class="mode-btn">Strange Combinations</button>
    </div>
```

- [ ] **Step 2: Delete the mode-picker screen**

Find and delete the entire block (lines 642–650):
```html
  <!-- Screen: Imagination Mode Picker -->
  <div id="screen-mode-picker" class="screen">
    <button class="back-btn" data-target="screen-home">←</button>
    <h2>Can you imagine...</h2>
    <div class="mode-buttons">
      <button id="btn-surreal" class="mode-btn">Surreal Narrative</button>
      <button id="btn-mutations" class="mode-btn">Mutations</button>
    </div>
  </div>
```

Remove it completely — nothing replaces it.

- [ ] **Step 3: Update the mutations type-picker screen**

Find (lines 652–655):
```html
  <!-- Screen: Mutations Type Picker -->
  <div id="screen-mutations-type" class="screen">
    <button class="back-btn" data-target="screen-mode-picker">←</button>
    <h2>Mutations</h2>
```

Replace with:
```html
  <!-- Screen: Strange Combinations Type Picker -->
  <div id="screen-mutations-type" class="screen">
    <button class="back-btn" data-target="screen-home">←</button>
    <h2>Strange Combinations</h2>
```

- [ ] **Step 4: Verify in browser**

Run `python3 -m http.server 8080` from the project root (`.claude/worktrees/wallpaper-density/`). Open `http://localhost:8080`.

Check:
1. Home screen shows three buttons: "Sparks", "Surreal Narratives", "Strange Combinations"
2. "Sparks" → goes to single-word prompt screen ✓
3. "Surreal Narratives" → **broken for now** (JS handler not wired yet — expected)
4. "Strange Combinations" → goes to type-picker screen with heading "Strange Combinations" and back arrow → returns to **home** ✓
5. No console errors

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: flatten home screen and rename menu labels"
```

---

### Task 2: JS changes

**Files:**
- Modify: `index.html` (event wiring section, `init()` function)

- [ ] **Step 1: Remove the btn-imagine handler and fix btn-surreal's promptBackTarget**

Find (lines 858–870):
```js
    document.getElementById('btn-imagine').addEventListener('click', () => {
      showScreen('screen-mode-picker');
    });

    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-mode-picker';
      currentPrompt = generateSurrealNarrative(null, {});
      showScreen('screen-imagine-prompt');
      const container = document.getElementById('imagine-prompt');
      renderPrompt(container, 'surreal');
      animateUnlockedSlots(container);
    });
```

Replace with (delete btn-imagine handler entirely, update `promptBackTarget`):
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

- [ ] **Step 2: Fix the btn-back-imagine fallback**

Find (line 905–907):
```js
    document.getElementById('btn-back-imagine').addEventListener('click', () => {
      showScreen(promptBackTarget ?? 'screen-mode-picker');
    });
```

Replace with:
```js
    document.getElementById('btn-back-imagine').addEventListener('click', () => {
      showScreen(promptBackTarget ?? 'screen-home');
    });
```

- [ ] **Step 3: Update disabled-during-load in `init()`**

Find (lines 933–938):
```js
        document.getElementById('btn-just-draw').disabled = false;
        document.getElementById('btn-imagine').disabled = false;
      } catch {
        document.getElementById('error-banner').classList.remove('hidden');
        document.getElementById('btn-just-draw').disabled = true;
        document.getElementById('btn-imagine').disabled = true;
```

Replace with:
```js
        document.getElementById('btn-just-draw').disabled = false;
        document.getElementById('btn-surreal').disabled = false;
        document.getElementById('btn-mutations').disabled = false;
      } catch {
        document.getElementById('error-banner').classList.remove('hidden');
        document.getElementById('btn-just-draw').disabled = true;
        document.getElementById('btn-surreal').disabled = true;
        document.getElementById('btn-mutations').disabled = true;
```

- [ ] **Step 4: Verify in browser**

Reload `http://localhost:8080`. Test all flows:

1. **Sparks** → single-word prompt spins and settles → back arrow → home ✓
2. **Surreal Narratives** → 4-slot prompt spins → back arrow → **home** (not mode picker) ✓
3. **Strange Combinations** → type picker → pick a type → 2-slot prompt → back arrow → **type picker** ✓ → back arrow → **home** ✓
4. **Lock + regen**: on any prompt screen, lock a slot, tap ↺ → locked slots stay still ✓
5. Open DevTools Network tab, throttle to Slow 3G, reload — all three home buttons should be disabled until data loads, then re-enable ✓
6. No console errors throughout

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: update JS handlers for flattened navigation"
```

---

## Self-Review

**Spec coverage:**
- ✅ "Just draw!" → "Sparks"
- ✅ "Can you imagine..." button removed
- ✅ `screen-mode-picker` deleted
- ✅ btn-surreal + btn-mutations bubble up to home screen
- ✅ "Surreal Narrative" → "Surreal Narratives"
- ✅ "Mutations" → "Strange Combinations" (button label + h2)
- ✅ Back button on mutations type-picker → screen-home
- ✅ `promptBackTarget` for surreal → 'screen-home'
- ✅ `btn-back-imagine` fallback → 'screen-home'
- ✅ Disabled-during-load updated for all three home buttons

**Placeholder scan:** No TBDs. All code blocks complete.

**Type consistency:** No new functions introduced. All existing IDs (`btn-surreal`, `btn-mutations`, `screen-mutations-type`, `btn-back-imagine`) are used consistently.
