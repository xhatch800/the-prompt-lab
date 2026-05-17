# Split app.js Into Focused Files — Design Spec

**Date:** 2026-05-17
**Feature:** Break 1048-line app.js into five files by concern; move JS into `js/` and CSS into `css/`

---

## Problem

`app.js` is 1048 lines with no clear separation of concerns — cauldron logic, pool-mode helpers, prompt rendering, utilities, and event wiring all live in one file. It's hard to find things and hard to read. CSS and JS also sit at the repo root with no folder structure.

---

## Goal

Split `app.js` into five files, each with a single clear responsibility, and move all JS into `js/` and CSS into `css/`. No bundler, no module syntax — plain `<script>` tags, all variables remain global, browser console access unchanged.

---

## Approach

Multiple `<script defer>` tags in `index.html`. All files share the same global scope. Functions in non-entry files only access state at call time (during `init()` and user interactions), not at definition time, so load order is safe. No syntax changes to any existing code.

---

## Directory Layout

```
the-prompt-lab/
├── css/
│   └── style.css          ← moved from style.css
├── js/
│   ├── utils.js           ← new
│   ├── cauldron.js        ← new
│   ├── pool.js            ← new
│   ├── prompt-screen.js   ← new
│   └── app.js             ← slimmed down from app.js
├── assets/
├── data/
├── index.html
└── ...
```

The root-level `app.js` and `style.css` are deleted once their contents are moved.

---

## File Structure

### `js/utils.js` (~30 lines)
Pure utility functions with no dependencies on state or DOM.

**Contains:**
- `pick(arr)`
- `shuffle(arr)`
- `drawFromDeck(deck, pool)`
- `filterByTags(pool, tags, tagMode)`

---

### `js/cauldron.js` (~350 lines)
All cauldron config, generation, and rendering logic.

**Contains:**
- `getAvailableTags(slot)`
- `initCauldronConfig(preset)`
- `generateCauldron(config, current, locked)`
- `buildSlotRow(slot, isStrange)`
- `renderCauldronConfig()`

**Reads from globals:** `store`, `cauldronConfig`, `cauldronDecks`, `openTagPickerSlotId`

---

### `js/pool.js` (~200 lines)
Pool-mode configs and all filter/regen logic for Everyday Life and Strange Scenes.

**Contains:**
- `jdConfig` — Everyday Life mode config object
- `ssConfig` — Strange Scenes mode config object
- `generateFromPool(cfg)`
- `regenPoolMode(cfg)`
- `renderFilterSheet(cfg)`
- `openFilterSheet(cfg)`
- `closeFilterSheet(cfg)`
- `applyFilter(cfg)`
- `updateFilterBtn(cfg)`
- `updateTagIndicator(cfg)`

**Reads from globals:** `store`, `activeConfig`

---

### `js/prompt-screen.js` (~250 lines)
Shared prompt screen rendering, navigation, history, and gestures.

**Contains:**
- `LOCK_SVG` constant
- `renderPrompt(container, mode)`
- `animateSlot(el, pool, finalValue, durationMs)`
- `animateUnlockedSlots(container)`
- `toggleLock(slot, container, mode)`
- `showScreen(id)`
- `enterMode(config)`
- `clearHistory()`
- `pushToHistory(prompt)`
- `renderHistoryWidget()`
- `navigateHistory(direction)`
- `addSwipe(elementId)`
- `setupCopyBtn(btnId, getTextFn)`

**Reads from globals:** `activeConfig`, `currentPrompt`, `lockedSlots`, `promptHistory`, `historyIndex`, `cauldronConfig`

---

### `js/app.js` (~200 lines)
State declarations, mode config for cauldron prompt screen, all event wiring, data loading, and `init()`.

**Contains:**
- `store = {}`
- All mutable state: `cauldronConfig`, `openTagPickerSlotId`, `activeConfig`, `currentPrompt`, `lockedSlots`, `cauldronDecks`, `promptHistory`, `historyIndex`, `HISTORY_MAX`
- `cauldronModeConfig` — cauldron prompt screen mode config
- All `addEventListener` calls
- `init()` and data loading (`fetch` calls)

**Note:** `generateSurrealNarrative` is dead code (defined but never called) — delete it during this split.

---

## Changes to index.html

Replace the single script tag and the CSS link:
```html
<!-- before -->
<link rel="stylesheet" href="style.css">
...
<script src="app.js" defer></script>

<!-- after -->
<link rel="stylesheet" href="css/style.css">
...
<script src="js/utils.js" defer></script>
<script src="js/cauldron.js" defer></script>
<script src="js/pool.js" defer></script>
<script src="js/prompt-screen.js" defer></script>
<script src="js/app.js" defer></script>
```

Order matters: `app.js` runs last so all function definitions from the other files are available when event wiring executes. State variables declared in `app.js` are accessed inside function bodies (not at definition time), so earlier-loaded files can safely reference them.

---

## What Does NOT Change

- No `import`/`export` syntax
- No bundler or build step
- GitHub Pages compatibility unchanged
- Browser console access to all globals unchanged
- `index.html` structure unchanged except the script tags
- `css/style.css` — content unchanged, only path changes
- All existing behavior unchanged — this is a pure file reorganization

---

## Regression Test

After the split, manually verify in the browser:
- Everyday Life: prompt renders, filter works, history nav works, back to home
- Strange Scenes: same flow
- Surreal Cauldron: generate, lock a word, back to config, generate again (locked word preserved), history grows
- No console errors on load or interaction
