# Surreal Cauldron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Surreal Cauldron mode — a custom prompt builder with component toggles, tag filtering, and two presets — that feeds into the existing prompt screen with all current features (locking, regen, history, wallpaper) unchanged.

**Architecture:** All changes in `index.html`. New `screen-cauldron-config` added alongside existing screens. `cauldronConfig` state drives dynamic JS rendering of the config UI. `generateCauldron()` produces prompt objects compatible with existing `renderPrompt()`, `lockedSlots`, `promptHistory`, and regen infrastructure. A new `'cauldron'` branch is added to `renderPrompt()` and `animateUnlockedSlots()`.

**Tech Stack:** Vanilla JS, HTML, CSS — no frameworks, no dependencies. Served via `python3 -m http.server 8080`.

**Branch:** `enhance/cauldron` — do NOT touch `main`.

---

## File Structure

Single file changed: `index.html` (~1200 lines). Changes are additive — no existing functions are removed, only extended.

| Section | Lines (approx) | What changes |
|---|---|---|
| `<style>` block | 10–317 | Add ~120 lines of cauldron CSS |
| Home screen HTML | 719–730 | Add `btn-cauldron` button |
| After `screen-just-draw` HTML | ~760 | Add `screen-cauldron-config` HTML shell |
| State variables | ~944 | Add `cauldronConfig`, `openTagPickerSlotId` |
| After `toggleLock()` | ~942 | Add `filterByTags`, `initCauldronConfig`, `generateCauldron`, `renderCauldronConfig`, `buildSlotRow`, `getAvailableTags` |
| `renderPrompt()` | 853–874 | Add cauldron branch at top |
| `animateUnlockedSlots()` | 913–929 | Add cauldron branch at top |
| `showScreen()` | 792–802 | Add `screen-cauldron-config` to state-preserve exclusion |
| Event wiring | 1044+ | Add btn-cauldron, config back, generate; extend regen handler |
| `init()` | 1164–1196 | Keep full tagged objects, extract sorted tags |

---

## Task 1: Extend data loading to keep full tagged objects and extract unique tags

**Files:**
- Modify: `index.html` lines 1166–1186

- [ ] **Step 1: Replace the `init()` fetch block**

Find lines 1166–1186. Replace the entire destructuring + store assignment block with:

```js
const [justDraw, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw] =
  await Promise.all([
    fetch('data/just_draw.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch('data/adjectives.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch('data/nouns_organic_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch('data/nouns_synthetic_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch('data/verbs_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch('data/environments_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
  ]);

if ([justDraw, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw]
    .some(d => !Array.isArray(d) || d.length === 0)) {
  throw new Error('Empty data');
}

store.justDraw            = justDraw;
store.adjectives          = adjectives;
// Name-only arrays — used by existing generation functions unchanged
store.nounsOrganic        = nounsOrganicRaw.map(i => i.name);
store.nounsSynthetic      = nounsSyntheticRaw.map(i => i.name);
store.verbs               = verbsRaw.map(i => i.name);
store.environments        = environmentsRaw.map(i => i.name);
// Full tagged objects — used by cauldron for tag filtering
store.nounsOrganicFull    = nounsOrganicRaw;
store.nounsSyntheticFull  = nounsSyntheticRaw;
store.verbsFull           = verbsRaw;
store.environmentsFull    = environmentsRaw;
// Unique sorted tags extracted per pool — used by tag picker UI
store.nounsOrganicTags    = [...new Set(nounsOrganicRaw.flatMap(i => i.tags))].sort();
store.nounsSyntheticTags  = [...new Set(nounsSyntheticRaw.flatMap(i => i.tags))].sort();
store.verbsTags           = [...new Set(verbsRaw.flatMap(i => i.tags))].sort();
store.environmentsTags    = [...new Set(environmentsRaw.flatMap(i => i.tags))].sort();
```

- [ ] **Step 2: Verify in browser**

Start server if not running: `python3 -m http.server 8080`
Open http://localhost:8080, open DevTools console (F12), type:
```js
store.nounsOrganicFull[0]
// Expected: {name: "...", tags: [...]}  — a full object, not a string

store.nounsOrganicTags.slice(0, 5)
// Expected: array of 5 alphabetically sorted tag strings

store.nounsOrganic[0]
// Expected: a plain string — existing code still works
```

- [ ] **Step 3: Verify existing modes still work**

Click Sparks, Surreal Narratives, Strange Combinations — all should generate prompts normally. No regressions.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(cauldron): load full tagged objects and extract unique sorted tags"
```

---

## Task 2: Add CSS for cauldron config screen

**Files:**
- Modify: `index.html` — add CSS inside `<style>` block, immediately before the closing `</style>` tag (line 317)

- [ ] **Step 1: Add cauldron CSS**

Insert the following block immediately before `</style>` (line 317):

```css
/* ── Surreal Cauldron config screen ── */
#screen-cauldron-config {
  justify-content: flex-start;
  overflow-y: auto;
  padding: 4.5rem 1.5rem 2rem;
  align-items: stretch;
}

.cc-body {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.cc-section-title {
  font-family: sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 8px;
  margin-top: 4px;
}

.cc-components-title {
  font-family: sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b85c38;
  margin-bottom: 8px;
  margin-top: 16px;
}

/* Preset strip */
.cc-preset-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.cc-preset-chip {
  font-family: sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  border: 2px solid #b85c38;
  border-radius: 20px;
  padding: 4px 14px;
  background: #fdf8f0;
  color: #b85c38;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.cc-preset-chip.active {
  background: #b85c38;
  color: white;
}

/* Slot row */
.cc-slot {
  background: #fff;
  border: 1.5px solid #b85c38;
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 7px;
}

.cc-slot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.cc-slot-name {
  flex: 1;
  font-family: 'Caveat', cursive;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c2c2c;
}

.cc-remove {
  font-family: sans-serif;
  font-size: 0.65rem;
  color: #b85c38;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.cc-toggle-on {
  width: 36px;
  height: 20px;
  background: #b85c38;
  border: none;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}
.cc-toggle-on::after {
  content: '';
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  position: absolute;
  right: 2px;
  top: 2px;
}

.cc-untagged-note {
  font-family: sans-serif;
  font-size: 0.65rem;
  color: #aaa;
  font-style: italic;
}

/* Pool selector */
.cc-pool-toggle {
  display: inline-flex;
  border: 1.5px solid #b85c38;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 8px;
}

.cc-pool-btn {
  font-family: sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 11px;
  background: none;
  border: none;
  color: #b85c38;
  cursor: pointer;
}
.cc-pool-btn.active {
  background: #b85c38;
  color: white;
}

/* Tags area */
.cc-tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.cc-any-all {
  display: inline-flex;
  border: 1.5px solid #b85c38;
  border-radius: 16px;
  overflow: hidden;
}

.cc-any-all-btn {
  font-family: sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 8px;
  background: none;
  border: none;
  color: #b85c38;
  cursor: pointer;
}
.cc-any-all-btn.active {
  background: #b85c38;
  color: white;
}

.cc-tag-chip {
  font-family: sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  background: #fdf0e8;
  border: 1.5px solid #b85c38;
  color: #b85c38;
  border-radius: 16px;
  padding: 2px 8px;
  cursor: pointer;
}

.cc-tag-add {
  font-family: sans-serif;
  font-size: 0.7rem;
  background: none;
  border: 1.5px dashed #ccc;
  color: #aaa;
  border-radius: 16px;
  padding: 2px 8px;
  cursor: pointer;
}
.cc-tag-add.open {
  border-style: solid;
  border-color: #b85c38;
  color: #b85c38;
}

/* Tag picker panel */
.cc-tag-picker {
  border-top: 1.5px solid #f0e8dc;
  background: #fdf8f0;
  margin: 8px -12px -8px;
  padding: 10px 12px 8px;
  border-radius: 0 0 8px 8px;
}

.cc-tag-picker-label {
  font-family: sans-serif;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 8px;
}

.cc-tag-picker-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}

.cc-avail-tag {
  font-family: sans-serif;
  font-size: 0.7rem;
  background: #fff;
  border: 1.5px solid #d4c8ba;
  color: #666;
  border-radius: 16px;
  padding: 3px 10px;
  cursor: pointer;
}
.cc-avail-tag.selected {
  background: #fdf0e8;
  border-color: #b85c38;
  color: #b85c38;
}

.cc-tag-done {
  font-family: sans-serif;
  font-size: 0.7rem;
  color: #b85c38;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  display: block;
  text-align: right;
}

/* Add noun / add component */
.cc-add-noun {
  font-family: sans-serif;
  font-size: 0.78rem;
  color: #b85c38;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-bottom: 6px;
  display: inline-block;
}

.cc-add-comp {
  margin-bottom: 6px;
}

.cc-add-comp-label {
  font-family: sans-serif;
  font-size: 0.78rem;
  color: #b85c38;
  text-decoration: underline;
  cursor: pointer;
  display: inline-block;
  margin-bottom: 7px;
}

.cc-add-comp-chips {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.cc-add-comp-chip {
  font-family: sans-serif;
  font-size: 0.75rem;
  background: #fff;
  border: 1.5px solid #d4c8ba;
  color: #666;
  border-radius: 16px;
  padding: 4px 12px;
  cursor: pointer;
}
.cc-add-comp-chip:hover {
  border-color: #b85c38;
  color: #b85c38;
}

/* Generate button */
.cc-generate-btn {
  font-family: 'Caveat', cursive;
  font-size: 1.8rem;
  font-weight: 700;
  background: #b85c38;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1.8rem;
  cursor: pointer;
  width: 100%;
  margin-top: 14px;
  box-shadow: 2px 2px 0 rgba(184,92,56,0.3);
  transition: box-shadow 0.1s ease, transform 0.1s ease;
}
.cc-generate-btn:hover {
  box-shadow: 1px 1px 0 rgba(184,92,56,0.3);
  transform: translate(1px, 1px);
}
.cc-generate-btn:disabled {
  background: #d4c8ba;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}
```

- [ ] **Step 2: Verify CSS loads without errors**

Open DevTools console at http://localhost:8080. No CSS errors should appear in the console.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(cauldron): add CSS for config screen components"
```

---

## Task 3: Add home screen button and config screen HTML shell

**Files:**
- Modify: `index.html` — home screen (line 728) + new screen after `screen-just-draw` (after line 760)

- [ ] **Step 1: Add Surreal Cauldron button to home screen**

Find line 728 (`<button id="btn-mutations" class="mode-btn">Strange Combinations</button>`).
Add immediately after it (still inside `.mode-buttons`):

```html
      <button id="btn-cauldron" class="mode-btn" disabled>✦ Surreal Cauldron</button>
```

- [ ] **Step 2: Add config screen HTML**

Find line 760 (end of `screen-just-draw`: `</div>`). Add immediately after it:

```html
  <!-- Screen: Surreal Cauldron Config -->
  <div id="screen-cauldron-config" class="screen">
    <div class="back-row">
      <button id="btn-cauldron-back" class="back-btn">←</button>
      <span class="screen-label">Surreal Cauldron</span>
    </div>
    <div class="cc-body">
      <div class="cc-section-title">Start from</div>
      <div class="cc-preset-strip">
        <button class="cc-preset-chip active" id="cc-preset-surreal">Surreal Narrative</button>
        <button class="cc-preset-chip" id="cc-preset-strange">Strange Combinations</button>
      </div>
      <div class="cc-components-title">Components</div>
      <div id="cc-slots"></div>
      <button class="cc-generate-btn" id="cc-generate" disabled>Generate ↓</button>
    </div>
  </div>
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:8080. The home screen should now show a fourth button "✦ Surreal Cauldron" (greyed out, disabled). No JS errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(cauldron): add home button and config screen HTML shell"
```

---

## Task 4: Add cauldron state variables and core functions

**Files:**
- Modify: `index.html` — state variables block (~line 944) and after `toggleLock()` (~line 942)

- [ ] **Step 1: Add state variables**

Find line 945 (`let imagineMode = null;`). Add two new variables immediately before it:

```js
// ── Cauldron state ───────────────────────────────────────────
let cauldronConfig = null;       // { preset, slots } — set by initCauldronConfig()
let openTagPickerSlotId = null;  // id of the slot whose inline tag picker is open
```

- [ ] **Step 2: Add `filterByTags()` helper**

Find the line `function toggleLock(slot, container, mode) {` (~line 935). Insert these functions immediately **before** it:

```js
// ── Cauldron helpers ─────────────────────────────────────────
function filterByTags(pool, tags, tagMode) {
  if (!tags || tags.length === 0) return pool;
  return tagMode === 'all'
    ? pool.filter(item => tags.every(t => item.tags.includes(t)))
    : pool.filter(item => tags.some(t => item.tags.includes(t)));
}

function getAvailableTags(slot) {
  if (slot.type === 'noun') {
    if (slot.pool === 'organic') return store.nounsOrganicTags;
    if (slot.pool === 'synthetic') return store.nounsSyntheticTags;
    return [...new Set([...store.nounsOrganicTags, ...store.nounsSyntheticTags])].sort();
  }
  if (slot.type === 'verb') return store.verbsTags;
  if (slot.type === 'environment') return store.environmentsTags;
  return [];
}

function initCauldronConfig(preset) {
  openTagPickerSlotId = null;
  if (preset === 'strange') {
    cauldronConfig = {
      preset: 'strange',
      slots: [
        { id: 'noun_1', type: 'noun', enabled: true, pool: 'either', tags: [], tagMode: 'any' },
        { id: 'noun_2', type: 'noun', enabled: true, pool: 'either', tags: [], tagMode: 'any' },
      ]
    };
  } else {
    cauldronConfig = {
      preset: 'surreal',
      slots: [
        { id: 'adjective',   type: 'adjective',   enabled: true },
        { id: 'noun_1',      type: 'noun',         enabled: true,  pool: 'either', tags: [], tagMode: 'any' },
        { id: 'verb',        type: 'verb',         enabled: true,  tags: [], tagMode: 'any' },
        { id: 'environment', type: 'environment',  enabled: true,  tags: [], tagMode: 'any' },
      ]
    };
  }
}

function generateCauldron(config, current, locked) {
  const prev = current || {};
  const result = {};
  const activeSlots = config.slots.filter(s => s.enabled);
  const usedNames = {}; // tracks used noun names per pool key to prevent duplicates

  for (const slot of activeSlots) {
    if (locked[slot.id]) { result[slot.id] = prev[slot.id]; continue; }

    if (slot.type === 'adjective') {
      result[slot.id] = pick(store.adjectives);

    } else if (slot.type === 'noun') {
      const fullPool = slot.pool === 'organic'   ? store.nounsOrganicFull
                     : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                     : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
      const filtered = filterByTags(fullPool, slot.tags, slot.tagMode);
      const candidates = filtered.length ? filtered : fullPool;
      // Duplicate prevention: exclude names already used from the same pool key
      const poolKey = slot.pool;
      if (!usedNames[poolKey]) usedNames[poolKey] = new Set();
      const deduped = candidates.filter(n => !usedNames[poolKey].has(n.name));
      const chosen = pick(deduped.length ? deduped : candidates);
      result[slot.id] = chosen.name;
      usedNames[poolKey].add(chosen.name);

    } else if (slot.type === 'verb') {
      const filtered = filterByTags(store.verbsFull, slot.tags, slot.tagMode);
      result[slot.id] = pick(filtered.length ? filtered : store.verbsFull).name;

    } else if (slot.type === 'environment') {
      const filtered = filterByTags(store.environmentsFull, slot.tags, slot.tagMode);
      result[slot.id] = pick(filtered.length ? filtered : store.environmentsFull).name;
    }
  }
  return result;
}
```

- [ ] **Step 3: Verify functions exist in console**

Open DevTools at http://localhost:8080. Run:
```js
typeof filterByTags    // Expected: "function"
typeof initCauldronConfig  // Expected: "function"
typeof generateCauldron    // Expected: "function"
```

- [ ] **Step 4: Verify `filterByTags` logic**

In console (after data loads):
```js
filterByTags(store.nounsOrganicFull, ['aquatic'], 'any').length > 0  // Expected: true
filterByTags(store.nounsOrganicFull, [], 'any').length === store.nounsOrganicFull.length  // Expected: true
filterByTags(store.nounsOrganicFull, ['aquatic', 'enormous'], 'all').every(n => n.tags.includes('aquatic') && n.tags.includes('enormous'))  // Expected: true
```

- [ ] **Step 5: Verify `generateCauldron` produces correct shape**

In console:
```js
initCauldronConfig('surreal');
const p = generateCauldron(cauldronConfig, null, {});
Object.keys(p)  // Expected: ['adjective', 'noun_1', 'verb', 'environment']
typeof p.adjective  // Expected: 'string'
typeof p.noun_1     // Expected: 'string'
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(cauldron): add cauldron state, filterByTags, initCauldronConfig, generateCauldron"
```

---

## Task 5: Add `renderCauldronConfig()` — the config screen rendering engine

**Files:**
- Modify: `index.html` — add after `generateCauldron()` (from Task 4), before `toggleLock()`

- [ ] **Step 1: Add `buildSlotRow()` helper**

Insert immediately after `generateCauldron()` (before `toggleLock()`):

```js
function buildSlotRow(slot, isStrange) {
  const div = document.createElement('div');
  div.className = 'cc-slot';

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'cc-slot-header';

  const nameEl = document.createElement('span');
  nameEl.className = 'cc-slot-name';
  const nounNum = slot.id.startsWith('noun_') ? parseInt(slot.id.split('_')[1], 10) : null;
  nameEl.textContent = slot.type === 'noun'
    ? (nounNum === 1 ? 'Noun' : `Noun ${nounNum}`)
    : slot.type.charAt(0).toUpperCase() + slot.type.slice(1);
  header.appendChild(nameEl);

  // Remove link (extra nouns only — noun_2 and beyond)
  if (slot.type === 'noun' && slot.id !== 'noun_1') {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'cc-remove';
    removeBtn.textContent = 'remove';
    removeBtn.addEventListener('click', () => {
      cauldronConfig.slots = cauldronConfig.slots.filter(s => s.id !== slot.id);
      if (openTagPickerSlotId === slot.id) openTagPickerSlotId = null;
      renderCauldronConfig();
    });
    header.appendChild(removeBtn);
  }

  // Toggle-off button (surreal mode only; not on noun slots — nouns are removed, not toggled)
  if (!isStrange && slot.type !== 'noun') {
    const tog = document.createElement('button');
    tog.className = 'cc-toggle-on';
    tog.setAttribute('aria-label', `Disable ${slot.type}`);
    tog.addEventListener('click', () => {
      slot.enabled = false;
      if (openTagPickerSlotId === slot.id) openTagPickerSlotId = null;
      renderCauldronConfig();
    });
    header.appendChild(tog);
  }

  div.appendChild(header);

  // ── Adjective: untagged note ──
  if (slot.type === 'adjective') {
    const note = document.createElement('span');
    note.className = 'cc-untagged-note';
    note.textContent = 'untagged — fully random';
    div.appendChild(note);
    return div;
  }

  // ── Pool toggle (nouns only) ──
  if (slot.type === 'noun') {
    const poolDiv = document.createElement('div');
    poolDiv.className = 'cc-pool-toggle';
    ['organic', 'either', 'synthetic'].forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'cc-pool-btn' + (slot.pool === p ? ' active' : '');
      btn.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      btn.addEventListener('click', () => {
        slot.pool = p;
        slot.tags = []; // clear tags when pool changes — tags may no longer be valid
        slot.tagMode = 'any';
        openTagPickerSlotId = null;
        renderCauldronConfig();
      });
      poolDiv.appendChild(btn);
    });
    div.appendChild(poolDiv);
  }

  // ── Tags area ──
  const tagsArea = document.createElement('div');
  tagsArea.className = 'cc-tags-area';

  // ANY/ALL toggle (only when ≥1 tag selected)
  if (slot.tags.length > 0) {
    const anyAll = document.createElement('div');
    anyAll.className = 'cc-any-all';
    ['any', 'all'].forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'cc-any-all-btn' + (slot.tagMode === m ? ' active' : '');
      btn.textContent = m.toUpperCase();
      btn.addEventListener('click', () => {
        slot.tagMode = m;
        renderCauldronConfig();
      });
      anyAll.appendChild(btn);
    });
    tagsArea.appendChild(anyAll);
  }

  // Selected tag chips (each tappable to remove)
  slot.tags.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = 'cc-tag-chip';
    chip.textContent = tag + ' ×';
    chip.addEventListener('click', () => {
      slot.tags = slot.tags.filter(t => t !== tag);
      if (slot.tags.length === 0) slot.tagMode = 'any';
      renderCauldronConfig();
    });
    tagsArea.appendChild(chip);
  });

  // + tag button
  const addTagBtn = document.createElement('button');
  const pickerOpen = openTagPickerSlotId === slot.id;
  addTagBtn.className = 'cc-tag-add' + (pickerOpen ? ' open' : '');
  addTagBtn.textContent = pickerOpen ? '+ tag ▴' : '+ tag ▾';
  addTagBtn.addEventListener('click', () => {
    openTagPickerSlotId = pickerOpen ? null : slot.id;
    renderCauldronConfig();
  });
  tagsArea.appendChild(addTagBtn);

  div.appendChild(tagsArea);

  // ── Inline tag picker panel ──
  if (pickerOpen) {
    const picker = document.createElement('div');
    picker.className = 'cc-tag-picker';

    const label = document.createElement('div');
    label.className = 'cc-tag-picker-label';
    label.textContent = 'Available tags — alphabetical';
    picker.appendChild(label);

    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'cc-tag-picker-chips';
    const available = getAvailableTags(slot);
    available.forEach(tag => {
      const chip = document.createElement('button');
      const isSelected = slot.tags.includes(tag);
      chip.className = 'cc-avail-tag' + (isSelected ? ' selected' : '');
      chip.textContent = isSelected ? tag + ' ✓' : tag;
      chip.addEventListener('click', () => {
        if (isSelected) {
          slot.tags = slot.tags.filter(t => t !== tag);
          if (slot.tags.length === 0) slot.tagMode = 'any';
        } else {
          slot.tags.push(tag);
        }
        renderCauldronConfig();
      });
      chipsDiv.appendChild(chip);
    });
    picker.appendChild(chipsDiv);

    const doneBtn = document.createElement('button');
    doneBtn.className = 'cc-tag-done';
    doneBtn.textContent = 'done';
    doneBtn.addEventListener('click', () => {
      openTagPickerSlotId = null;
      renderCauldronConfig();
    });
    picker.appendChild(doneBtn);

    div.appendChild(picker);
  }

  return div;
}
```

- [ ] **Step 2: Add `renderCauldronConfig()`**

Insert immediately after `buildSlotRow()`:

```js
function renderCauldronConfig() {
  const isStrange = cauldronConfig.preset === 'strange';

  // Update preset chips
  document.getElementById('cc-preset-surreal').classList.toggle('active', !isStrange);
  document.getElementById('cc-preset-strange').classList.toggle('active', isStrange);

  // Render active slots
  const slotsContainer = document.getElementById('cc-slots');
  slotsContainer.innerHTML = '';

  const activeSlots = cauldronConfig.slots.filter(s => s.enabled);
  activeSlots.forEach(slot => {
    slotsContainer.appendChild(buildSlotRow(slot, isStrange));
  });

  // + add another Noun (max 4)
  const nounCount = cauldronConfig.slots.filter(s => s.type === 'noun' && s.enabled).length;
  if (nounCount < 4) {
    const addNounBtn = document.createElement('button');
    addNounBtn.className = 'cc-add-noun';
    addNounBtn.textContent = '+ add another Noun';
    addNounBtn.addEventListener('click', () => {
      const nextNum = cauldronConfig.slots.filter(s => s.type === 'noun').length + 1;
      // Insert new noun after last existing noun in slots array
      const lastNounIdx = cauldronConfig.slots.reduce((acc, s, i) => s.type === 'noun' ? i : acc, -1);
      const newSlot = { id: `noun_${nextNum}`, type: 'noun', enabled: true, pool: 'either', tags: [], tagMode: 'any' };
      cauldronConfig.slots.splice(lastNounIdx + 1, 0, newSlot);
      renderCauldronConfig();
    });
    slotsContainer.appendChild(addNounBtn);
  }

  // + add component (surreal mode only — shows inactive component types)
  if (!isStrange) {
    const inactiveTypes = ['adjective', 'verb', 'environment'].filter(type =>
      !cauldronConfig.slots.find(s => s.type === type && s.enabled)
    );
    if (inactiveTypes.length > 0) {
      const addCompDiv = document.createElement('div');
      addCompDiv.className = 'cc-add-comp';

      const addCompLabel = document.createElement('span');
      addCompLabel.className = 'cc-add-comp-label';
      addCompLabel.textContent = '+ add component';
      addCompDiv.appendChild(addCompLabel);

      const chipsDiv = document.createElement('div');
      chipsDiv.className = 'cc-add-comp-chips';
      inactiveTypes.forEach(type => {
        const chip = document.createElement('button');
        chip.className = 'cc-add-comp-chip';
        chip.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        chip.addEventListener('click', () => {
          // Re-enable the slot if it exists, otherwise add it
          const existing = cauldronConfig.slots.find(s => s.type === type);
          if (existing) {
            existing.enabled = true;
          } else {
            // Insert in canonical order: adjective first, then nouns, then verb, then environment
            const order = ['adjective', 'noun', 'verb', 'environment'];
            const newSlot = type === 'adjective'
              ? { id: type, type, enabled: true }
              : { id: type, type, enabled: true, tags: [], tagMode: 'any' };
            const insertBefore = cauldronConfig.slots.findIndex(s => order.indexOf(s.type) > order.indexOf(type));
            if (insertBefore === -1) cauldronConfig.slots.push(newSlot);
            else cauldronConfig.slots.splice(insertBefore, 0, newSlot);
          }
          renderCauldronConfig();
        });
        chipsDiv.appendChild(chip);
      });
      addCompDiv.appendChild(chipsDiv);
      slotsContainer.appendChild(addCompDiv);
    }
  }

  // Update generate button disabled state
  document.getElementById('cc-generate').disabled = activeSlots.length === 0;
}
```

- [ ] **Step 3: Smoke test in console**

Open http://localhost:8080, in console run:
```js
initCauldronConfig('surreal');
renderCauldronConfig();
// Manually navigate to config screen:
showScreen('screen-cauldron-config');
```
Expected: config screen shows with Surreal Narrative preset active, 4 component rows (Adjective, Noun, Verb, Environment), Generate button enabled.

- [ ] **Step 4: Test Strange Combinations preset**

In console:
```js
initCauldronConfig('strange');
renderCauldronConfig();
```
Expected: only Noun 1 and Noun 2 rows shown. No "+ add component" visible.

- [ ] **Step 5: Test tag picker toggle**

Click "+ tag ▾" on any tagged row — the inline panel should expand with alphabetical tags. Clicking a tag highlights it. Clicking "done" collapses the panel. Clicking the selected tag chip removes it.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(cauldron): add renderCauldronConfig and buildSlotRow — config screen fully interactive"
```

---

## Task 6: Extend `renderPrompt()` and `animateUnlockedSlots()` for cauldron mode

**Files:**
- Modify: `index.html` — `renderPrompt()` (~line 853) and `animateUnlockedSlots()` (~line 913)

- [ ] **Step 1: Add cauldron branch to `renderPrompt()`**

Find `function renderPrompt(container, mode) {` (~line 853). The function currently starts with:
```js
function renderPrompt(container, mode) {
  container.innerHTML = '';
  const slots = mode === 'surreal'
    ? ['adjective', 'noun', 'verb', 'environment']
    : ['noun1', 'noun2'];
  const sep = mode === 'surreal' ? ' · ' : ' + ';
```

Replace the entire function body with:

```js
function renderPrompt(container, mode) {
  container.innerHTML = '';

  // ── Cauldron mode: slots driven by cauldronConfig ──
  if (mode === 'cauldron') {
    const activeSlots = cauldronConfig.slots.filter(s => s.enabled);
    activeSlots.forEach((slot, i) => {
      const span = document.createElement('span');
      span.className = 'prompt-slot' + (lockedSlots[slot.id] ? ' locked' : '');
      span.dataset.slot = slot.id;
      span.innerHTML = (lockedSlots[slot.id] ? LOCK_SVG : '') + currentPrompt[slot.id];
      span.addEventListener('click', () => toggleLock(slot.id, container, mode));
      container.appendChild(span);
      if (i < activeSlots.length - 1) {
        const s = document.createElement('span');
        s.className = 'prompt-sep';
        s.textContent = ' · ';
        container.appendChild(s);
      }
    });
    return;
  }

  // ── Surreal / Mutations mode (existing) ──
  const slots = mode === 'surreal'
    ? ['adjective', 'noun', 'verb', 'environment']
    : ['noun1', 'noun2'];
  const sep = mode === 'surreal' ? ' · ' : ' + ';

  slots.forEach((slot, i) => {
    const span = document.createElement('span');
    span.className = 'prompt-slot' + (lockedSlots[slot] ? ' locked' : '');
    span.dataset.slot = slot;
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
```

- [ ] **Step 2: Add cauldron branch to `animateUnlockedSlots()`**

Find `function animateUnlockedSlots(container) {` (~line 913). Add a cauldron branch at the very top of the function, before the existing `const pools = {` line:

```js
function animateUnlockedSlots(container) {
  if (!currentPrompt) return;

  // ── Cauldron mode ──
  if (imagineMode === 'cauldron' && cauldronConfig) {
    container.querySelectorAll('.prompt-slot:not(.locked)').forEach(span => {
      const slotId = span.dataset.slot;
      const slotDef = cauldronConfig.slots.find(s => s.id === slotId);
      if (!slotDef) return;
      let pool;
      if (slotDef.type === 'adjective') {
        pool = store.adjectives;
      } else if (slotDef.type === 'noun') {
        const full = slotDef.pool === 'organic'   ? store.nounsOrganicFull
                   : slotDef.pool === 'synthetic' ? store.nounsSyntheticFull
                   : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
        const filtered = filterByTags(full, slotDef.tags, slotDef.tagMode);
        pool = (filtered.length ? filtered : full).map(n => n.name);
      } else if (slotDef.type === 'verb') {
        const filtered = filterByTags(store.verbsFull, slotDef.tags, slotDef.tagMode);
        pool = (filtered.length ? filtered : store.verbsFull).map(n => n.name);
      } else if (slotDef.type === 'environment') {
        const filtered = filterByTags(store.environmentsFull, slotDef.tags, slotDef.tagMode);
        pool = (filtered.length ? filtered : store.environmentsFull).map(n => n.name);
      }
      if (pool && pool.length > 0) animateSlot(span, pool, currentPrompt[slotId], 1200);
    });
    return;
  }

  // ── Existing surreal / mutations mode ──
  const pools = {
    adjective:   store.adjectives,
    noun:        Math.random() < 0.5 ? store.nounsOrganic : store.nounsSynthetic,
    verb:        store.verbs,
    environment: store.environments,
    noun1: currentPrompt.noun1Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic,
    noun2: currentPrompt.noun2Pool === 'organic' ? store.nounsOrganic : store.nounsSynthetic,
  };

  container.querySelectorAll('.prompt-slot:not(.locked)').forEach(span => {
    const slot = span.dataset.slot;
    if (!pools[slot]) { console.warn('animateUnlockedSlots: unknown slot', slot); return; }
    animateSlot(span, pools[slot], currentPrompt[slot], 1200);
  });
}
```

- [ ] **Step 3: Verify existing modes still animate correctly**

Click Surreal Narratives and Strange Combinations — the slot-machine animation should still work. No regressions.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(cauldron): add cauldron mode to renderPrompt and animateUnlockedSlots"
```

---

## Task 7: Wire all cauldron events and update existing handlers

**Files:**
- Modify: `index.html` — `showScreen()` (~line 792), event wiring section (~line 1044), `btn-regen-imagine` handler (~line 1106), `init()` (~line 1164, enable btn-cauldron)

- [ ] **Step 1: Update `showScreen()` to preserve state on config screen**

Find `showScreen()` (~line 792). The current condition that clears state is:
```js
if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt') {
  currentPrompt = null;
  lockedSlots = {};
  clearHistory();
}
```

Replace with:
```js
if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt' && id !== 'screen-cauldron-config') {
  currentPrompt = null;
  lockedSlots = {};
  clearHistory();
}
```

- [ ] **Step 2: Wire `btn-cauldron` click handler**

Find the event wiring section (~line 1044, after `// ── Event wiring ─────`). Add after the existing `btn-mutations` click handler (~line 1083):

```js
document.getElementById('btn-cauldron').addEventListener('click', () => {
  clearHistory();
  lockedSlots = {};
  initCauldronConfig('surreal');
  renderCauldronConfig();
  showScreen('screen-cauldron-config');
});
```

- [ ] **Step 3: Wire config screen back button**

Add immediately after the `btn-cauldron` handler:

```js
document.getElementById('btn-cauldron-back').addEventListener('click', () => {
  cauldronConfig = null;
  openTagPickerSlotId = null;
  showScreen('screen-home');
});
```

- [ ] **Step 4: Wire preset chip click handlers**

Add immediately after the back button handler:

```js
document.getElementById('cc-preset-surreal').addEventListener('click', () => {
  initCauldronConfig('surreal');
  renderCauldronConfig();
});

document.getElementById('cc-preset-strange').addEventListener('click', () => {
  initCauldronConfig('strange');
  renderCauldronConfig();
});
```

- [ ] **Step 5: Wire Generate button**

Add immediately after the preset handlers:

```js
document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  clearHistory();
  lockedSlots = {};
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

- [ ] **Step 6: Extend `btn-regen-imagine` handler for cauldron mode**

Find the `btn-regen-imagine` handler (~line 1106):
```js
document.getElementById('btn-regen-imagine').addEventListener('click', () => {
  if (!imagineMode) return;
  const container = document.getElementById('imagine-prompt');
  if (imagineMode === 'surreal') {
    currentPrompt = generateSurrealNarrative(currentPrompt, lockedSlots);
  } else {
    currentPrompt = generateMutation(mutationType, currentPrompt, lockedSlots);
  }
```

Replace the inner `if/else` with a three-way branch:
```js
document.getElementById('btn-regen-imagine').addEventListener('click', () => {
  if (!imagineMode) return;
  const container = document.getElementById('imagine-prompt');
  if (imagineMode === 'surreal') {
    currentPrompt = generateSurrealNarrative(currentPrompt, lockedSlots);
  } else if (imagineMode === 'cauldron') {
    currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
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

- [ ] **Step 7: Enable `btn-cauldron` after data loads**

Find the store assignments in `init()` (~line 1187):
```js
document.getElementById('btn-just-draw').disabled = false;
document.getElementById('btn-surreal').disabled = false;
document.getElementById('btn-mutations').disabled = false;
```

Add one line:
```js
document.getElementById('btn-cauldron').disabled = false;
```

Also find the catch block (~line 1190) and add:
```js
document.getElementById('btn-cauldron').disabled = true;
```

- [ ] **Step 8: Full end-to-end test — Surreal Narrative preset**

Open http://localhost:8080:
1. Click "✦ Surreal Cauldron" — config screen opens with Surreal Narrative preset
2. Click "+ tag ▾" on Noun — tag picker expands with alphabetical tags
3. Select "aquatic" — tag chip appears, "aquatic ✓" highlighted in picker
4. Click "done" — picker closes, "ANY" toggle and "aquatic ×" chip visible
5. Click "Generate ↓" — prompt screen opens with all 4 slots (adjective · noun · verb · environment)
6. Slot-machine animation plays on all unlocked slots
7. Click a slot — it locks (orange border)
8. Click "↺ new prompt" — locked slot unchanged, others regenerate with new animation
9. Press ‹ and › arrows — history nav works
10. Click "←" back button — returns to config screen (not home)
11. Click "←" on config screen — returns to home

- [ ] **Step 9: Full end-to-end test — Strange Combinations preset**

1. Click "✦ Surreal Cauldron" — config opens
2. Click "Strange Combinations" preset chip — only Noun 1 and Noun 2 shown
3. Set Noun 1 pool to "Organic", Noun 2 pool to "Synthetic"
4. Click "Generate ↓" — prompt shows two nouns separated by " · "
5. Verify the two nouns are different words

- [ ] **Step 10: Verify existing modes unaffected**

Test Sparks, Surreal Narratives, Strange Combinations — all should work exactly as before. No regressions in locking, history, regen, wallpaper dimming.

- [ ] **Step 11: Commit**

```bash
git add index.html
git commit -m "feat(cauldron): wire all event handlers — Surreal Cauldron fully functional"
```

---

## Post-implementation checklist

- [ ] Cauldron button appears on home screen, disabled until data loads
- [ ] Config screen: Surreal Narrative preset shows 4 components; Strange Combinations shows 2 nouns only
- [ ] Tag picker expands inline with alphabetical tags; tags can be added/removed
- [ ] ANY/ALL toggle appears when ≥1 tag is selected
- [ ] Pool selector (Organic/Either/Synthetic) works; changing pool clears tags
- [ ] "+ add another Noun" adds up to 4 nouns total
- [ ] "+ add component" (Surreal Narrative only) re-enables toggled-off components
- [ ] Toggle-off button hides a component; re-enabling restores it in canonical position
- [ ] Generate button disabled when zero active components
- [ ] Prompt screen shows correct slots with separator " · " between all
- [ ] Slot-machine animation plays on unlocked slots using tag-filtered pools
- [ ] Locking, regen, history (← ›, dots, swipe), wallpaper dimming all work unchanged
- [ ] Back from prompt screen returns to config (not home)
- [ ] Back from config returns to home, clears cauldron state
- [ ] Switching presets resets config to preset defaults
- [ ] Existing modes (Sparks, Surreal Narratives, Strange Combinations) unaffected
- [ ] All work committed to `enhance/cauldron` branch — main untouched
