# Shared Prompt Screen — Design Spec

**Date:** 2026-05-16
**Feature:** Collapse three duplicate prompt screens into one shared screen

---

## Problem

`screen-just-draw`, `screen-strange-scenes`, and `screen-imagine-prompt` are structurally the same screen with different IDs, labels, and data sources. Any change to the prompt screen chrome (layout, buttons, styling) must be made three times. Adding a new mode requires copy-pasting a full screen block and duplicating ~100 lines of event wiring.

---

## Goal

One `#screen-prompt` in `index.html`. One set of event listeners in `app.js`. Adding a new mode means defining a config object and calling `enterMode(config)` — no new HTML, no new event wiring.

---

## Architecture

### Single shared screen in index.html

Replace the three screen divs (`screen-just-draw`, `screen-strange-scenes`, `screen-imagine-prompt`) with one `#screen-prompt` containing:

- Back button (`#prompt-back-btn`)
- Screen label (`#prompt-screen-label`)
- Copy button (`#prompt-copy-btn`)
- Filter button (`#prompt-filter-btn`) — hidden when mode has no filter
- Prompt content area (`#prompt-content`) — pool modes render plain text here; cauldron renders clickable slots
- Tag indicator (`#prompt-tag-indicator`) — hidden when mode has no filter
- Lock hint (`#prompt-lock-hint`) — hidden when mode has no locking
- Regen button (`#prompt-regen-btn`)
- History nav (`#prompt-history-nav`, `#prompt-hist-dots`, `#prompt-hist-prev`, `#prompt-hist-next`)
- Filter sheet overlay (`#prompt-filter-backdrop`, `#prompt-filter-sheet`, `#prompt-tag-chips`, `#prompt-any-all-row`, `#prompt-pool-count`, `#prompt-clear-btn`, `#prompt-apply-btn`) — hidden when mode has no filter

### Mode config objects

Each mode has a config object. The `ids` block is removed (all modes share the same element IDs now). Two flags replace it:

```js
const jdConfig = {
  getPool:    () => store.justDraw,
  getNames:   () => store.justDrawNames,
  textField:  'name',
  label:      'Everyday Life',
  backTarget: 'screen-home',
  sheetTitle: 'Filter by subject',
  hasFilter:  true,
  renderMode: 'pool',
  deck:       [],
  activeTags: [],
  tagMode:    'any',
  sheetTags:  [],
  sheetMode:  'any',
};

const ssConfig = {
  getPool:    () => store.strangeScenes,
  getNames:   () => store.strangeSceneTexts,
  textField:  'text',
  label:      'Strange Scenes',
  backTarget: 'screen-home',
  sheetTitle: 'Filter by theme',
  hasFilter:  true,
  renderMode: 'pool',
  deck:       [],
  activeTags: [],
  tagMode:    'any',
  sheetTags:  [],
  sheetMode:  'any',
};

const cauldronConfig = {
  label:      'Surreal Cauldron',    // set dynamically from cauldron build
  backTarget: 'screen-cauldron-config',
  hasFilter:  false,
  renderMode: 'cauldron',
};
```

### enterMode(config)

Single entry point for all modes:

```js
function enterMode(config) {
  activeConfig = config;
  document.getElementById('prompt-screen-label').textContent = config.label;
  document.getElementById('prompt-back-btn').dataset.target = config.backTarget;

  // Show/hide filter UI
  const hasFilter = config.hasFilter;
  document.getElementById('prompt-filter-btn').classList.toggle('hidden', !hasFilter);
  document.getElementById('prompt-tag-indicator').classList.toggle('hidden', !hasFilter);
  document.getElementById('prompt-filter-sheet').classList.add('hidden');
  document.getElementById('prompt-filter-backdrop').classList.add('hidden');

  // Show/hide lock hint
  const hasLock = config.renderMode === 'cauldron';
  document.getElementById('prompt-lock-hint').classList.toggle('hidden', !hasLock);

  showScreen('screen-prompt');
}
```

Home buttons call `enterMode` then trigger first generation:

```js
document.getElementById('btn-just-draw').addEventListener('click', () => {
  clearHistory();
  jdConfig.deck = [];
  jdConfig.activeTags = [];
  jdConfig.tagMode = 'any';
  enterMode(jdConfig);
  regenPoolMode(jdConfig);
});
```

### Event listeners wired once

All event listeners on the shared screen are wired once at `init()` time and read from `activeConfig` at call time:

```js
document.getElementById('prompt-regen-btn').addEventListener('click', () => {
  if (activeConfig.renderMode === 'pool') regenPoolMode(activeConfig);
  else generateCauldron();
});

document.getElementById('prompt-filter-btn').addEventListener('click', () => {
  openFilterSheet(activeConfig);
});

// etc. for backdrop, clear, apply, any/all toggle, history nav, copy, swipe
```

---

## What Changes

| File | Change |
|---|---|
| `index.html` | Remove `screen-just-draw`, `screen-strange-scenes`, `screen-imagine-prompt` — add single `#screen-prompt` |
| `app.js` | Remove `ids` block from `jdConfig`/`ssConfig`; add `cauldronConfig`; add `enterMode()`; collapse duplicated event wiring to single set of listeners on shared elements; update home button handlers |
| `style.css` | No changes — existing `.screen`, `.back-btn`, `.prompt-text`, etc. classes already apply |

---

## Helper function updates

Existing helper functions (`openFilterSheet`, `closeFilterSheet`, `renderFilterSheet`, `applyFilter`, `updateFilterBtn`, `updateTagIndicator`, `regenPoolMode`) currently look up element IDs from `config.ids`. After this change they use the fixed shared IDs directly. The config parameter stays — it still carries `getPool`, `textField`, `activeTags`, etc.

---

## Regression Test Plan

Because this touches every prompt screen, all three modes must be tested end to end after implementation. Run `python3 -m http.server 8080` from repo root and verify:

**Everyday Life**
- [ ] Tap → prompt renders
- [ ] ↺ new prompt → different prompt appears
- [ ] Filter sheet opens, subject chips render
- [ ] Select tags → pool count updates
- [ ] Apply → new prompt matches filter
- [ ] Clear → all prompts eligible again
- [ ] Any / All toggle works
- [ ] Copy button copies text
- [ ] History nav (dots, ‹ ›, swipe) navigates correctly
- [ ] Back returns to home

**Strange Scenes**
- [ ] Tap → prompt renders
- [ ] ↺ new prompt → different prompt appears
- [ ] Filter sheet opens, theme chips render
- [ ] Select tags → pool count updates
- [ ] Apply → new prompt matches filter
- [ ] Clear → all prompts eligible again
- [ ] Any / All toggle works
- [ ] Copy button copies text
- [ ] History nav (dots, ‹ ›, swipe) navigates correctly
- [ ] Back returns to home

**Surreal Cauldron**
- [ ] Tap → config screen loads
- [ ] Generate → prompt screen shows with slot-based prompt
- [ ] Words are clickable (lock/unlock)
- [ ] ↺ new prompt → unlocked slots regenerate, locked slots stay
- [ ] Copy button copies plain text
- [ ] History nav works
- [ ] Back returns to cauldron config
- [ ] No filter button visible
- [ ] Lock hint visible

**General**
- [ ] No console errors on load or during any interaction
- [ ] DevTools → Network: no 404s
