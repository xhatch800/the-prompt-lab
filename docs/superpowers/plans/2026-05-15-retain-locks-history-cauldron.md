# Retain Locks & History When Backing to Cauldron Config — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user backs from the cauldron prompt screen to the config screen and hits Generate again, locked words are preserved and the new generation appends to history instead of resetting it.

**Architecture:** Three line-level changes to the `cc-generate` click handler in `index.html`: remove the explicit `clearHistory()` and `lockedSlots = {}` resets, and pass the existing `currentPrompt` and `lockedSlots` into `generateCauldron()` instead of fresh empty values. No other files or functions need changing — `showScreen()`, `btn-back-imagine`, and `generateCauldron()` already behave correctly.

**Tech Stack:** Vanilla JS, single `index.html`. No test framework — verification via browser preview at `http://localhost:8080`.

---

## File structure

- Modify only: `index.html`
  - Update `cc-generate` click handler (~line 2011)

---

## Task 1: Update `cc-generate` to preserve locks and history

**Files:**
- Modify: `index.html` — `cc-generate` click handler (~line 2011)

- [ ] **Step 1: Locate the handler**

Open `index.html`. Find this block (around line 2011):

```js
document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  clearHistory();
  lockedSlots = {};
  cauldronDecks = {};
  imagineMode = 'cauldron';
  promptBackTarget = 'screen-cauldron-config';
  currentPrompt = generateCauldron(cauldronConfig, null, {});
  document.getElementById('imagine-screen-label').textContent = 'Surreal Cauldron';
  showScreen('screen-imagine-prompt');
  const container = document.getElementById('imagine-prompt');
  renderPrompt(container, 'cauldron');
  const hint = document.getElementById('lock-hint-imagine');
  hint.classList.add('animating');
  animateUnlockedSlots(container);
  setTimeout(() => hint.classList.remove('animating'), 1200);
  pushToHistory(currentPrompt);
  renderHistoryWidget('history-nav-imagine', 'hist-dots-imagine', 'hist-prev-imagine', 'hist-next-imagine');
});
```

- [ ] **Step 2: Apply the three changes**

Remove `clearHistory();` and `lockedSlots = {};`, and update the `generateCauldron` call:

```js
document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  cauldronDecks = {};
  imagineMode = 'cauldron';
  promptBackTarget = 'screen-cauldron-config';
  currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
  document.getElementById('imagine-screen-label').textContent = 'Surreal Cauldron';
  showScreen('screen-imagine-prompt');
  const container = document.getElementById('imagine-prompt');
  renderPrompt(container, 'cauldron');
  const hint = document.getElementById('lock-hint-imagine');
  hint.classList.add('animating');
  animateUnlockedSlots(container);
  setTimeout(() => hint.classList.remove('animating'), 1200);
  pushToHistory(currentPrompt);
  renderHistoryWidget('history-nav-imagine', 'hist-dots-imagine', 'hist-prev-imagine', 'hist-next-imagine');
});
```

Exact diff:
- Delete line: `clearHistory();`
- Delete line: `lockedSlots = {};`
- Change: `generateCauldron(cauldronConfig, null, {})` → `generateCauldron(cauldronConfig, currentPrompt, lockedSlots)`

- [ ] **Step 3: Verify — fresh Generate still works**

Start the server if not running: `python3 -m http.server 8080`

Open `http://localhost:8080`. Click **✦ Surreal Cauldron**, select a preset, tap **Generate ↓**. In DevTools console:

```js
console.assert(Object.keys(lockedSlots).length === 0, 'No locks on fresh generate');
console.assert(promptHistory.length === 1, 'History has exactly 1 entry after first generate');
console.log('✓ Fresh generate: locks empty, history has 1 entry');
```

Expected: `✓ Fresh generate: locks empty, history has 1 entry`

- [ ] **Step 4: Verify — locks and history survive back → re-generate cycle**

Still on the prompt screen, tap two words to lock them. Then in DevTools console:

```js
const lockedBefore = {...lockedSlots};
const historyLenBefore = promptHistory.length;
console.log('Locked slots before back:', Object.keys(lockedBefore));
console.log('History length before back:', historyLenBefore);

// Navigate back to config and generate again
document.getElementById('btn-back-imagine').click();
document.getElementById('cc-generate').click();

// After re-generate
const lockedAfter = {...lockedSlots};
const historyLenAfter = promptHistory.length;

console.assert(
  Object.keys(lockedBefore).every(k => lockedAfter[k]),
  'All previously locked slots are still locked'
);
console.assert(
  historyLenAfter === historyLenBefore + 1,
  `History appended: expected ${historyLenBefore + 1}, got ${historyLenAfter}`
);
console.log('✓ Locked slots preserved:', Object.keys(lockedAfter));
console.log('✓ History length after re-generate:', historyLenAfter);
```

Expected: locked slots unchanged, history length incremented by 1.

- [ ] **Step 5: Verify — entering from home still resets**

Navigate back to home (back button from config or prompt). Click **✦ Surreal Cauldron** again. In DevTools console:

```js
console.assert(Object.keys(lockedSlots).length === 0, 'Locks cleared on home re-entry');
console.assert(promptHistory.length === 0, 'History cleared on home re-entry');
console.log('✓ Home re-entry resets locks and history');
```

Expected: `✓ Home re-entry resets locks and history`

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: retain locks and history when backing to cauldron config"
```
