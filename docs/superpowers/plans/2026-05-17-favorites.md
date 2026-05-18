# Favorites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a favorites system — star any prompt to save it to localStorage, manage saved prompts from a Favorites screen, and export as a plain text file.

**Architecture:** A new `js/favorites.js` module exposes a `Favorites` global for all storage operations. The prompt screen gets a bounded zone with auto-scaling font and a fixed bottom band containing the star, nav, and regen. A new `screen-favorites` screen handles list management, search, delete, and export.

**Tech Stack:** Vanilla JS, localStorage, CSS absolute positioning, no build tools — serve with `python3 -m http.server 8080` and test in browser.

**Spec:** `docs/superpowers/specs/2026-05-17-favorites-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `js/favorites.js` | All localStorage reads/writes, export, screen rendering |
| Modify | `js/pool.js` | Add `mode` identifiers to `jdConfig` and `ssConfig` |
| Modify | `js/app.js` | Add `mode` to cauldron config, star wiring, favorites nav |
| Modify | `js/prompt-screen.js` | Add `fitPromptText()`, call on every render and history nav |
| Modify | `index.html` | Prompt zone wrapper, star button, favorites screen, home button, script tag |
| Modify | `css/style.css` | Prompt zone bounds, fixed bottom band, star button, favorites screen |

---

## Task 1: Create `js/favorites.js` — storage module

**Files:**
- Create: `js/favorites.js`

- [ ] **Step 1: Create the file**

```js
const Favorites = (() => {
  const KEY = 'promptlab_favorites';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }

  function save(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
  }

  function add(entry) {
    const arr = load();
    if (arr.some(e => e.text === entry.text)) return;
    arr.unshift(entry);
    save(arr);
  }

  function remove(text) {
    save(load().filter(e => e.text !== text));
  }

  function isFavorite(text) {
    return load().some(e => e.text === text);
  }

  function getAll() {
    return load();
  }

  function exportToFile() {
    const lines = load().map(e => e.text).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptlab-favorites.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderScreen() {
    // implemented in Task 7
  }

  return { add, remove, isFavorite, getAll, exportToFile, renderScreen };
})();
```

- [ ] **Step 2: Verify in browser console**

Open `http://localhost:8080` (run `python3 -m http.server 8080` if not running — do NOT load favorites.js yet, just paste and test in console for now):

```js
// Paste these lines one at a time in DevTools console:
Favorites.add({ text: 'a red fox in fog', mode: 'edl' });
Favorites.isFavorite('a red fox in fog'); // → true
Favorites.isFavorite('something else');   // → false
Favorites.add({ text: 'a red fox in fog', mode: 'edl' }); // no-op
Favorites.getAll().length; // → 1
Favorites.remove('a red fox in fog');
Favorites.getAll().length; // → 0
localStorage.getItem('promptlab_favorites'); // → '[]'
```

- [ ] **Step 3: Commit**

```bash
git add js/favorites.js
git commit -m "feat: add favorites.js storage module"
```

---

## Task 2: Add `mode` identifiers to config objects

**Files:**
- Modify: `js/pool.js` (add `mode` to `jdConfig` and `ssConfig`)
- Modify: `js/app.js` (add `mode` to `cauldronModeConfig`)

- [ ] **Step 1: Add `mode` to `jdConfig` in `js/pool.js`**

Find `jdConfig` (line ~2) and add `mode: 'edl'`:

```js
const jdConfig = {
  mode:       'edl',
  getPool:    () => store.justDraw,
  // ... rest unchanged
};
```

- [ ] **Step 2: Add `mode` to `ssConfig` in `js/pool.js`**

Find `ssConfig` (line ~16) and add `mode: 'ss'`:

```js
const ssConfig = {
  mode:       'ss',
  getPool:    () => store.strangeScenes,
  // ... rest unchanged
};
```

- [ ] **Step 3: Add `mode` to `cauldronModeConfig` in `js/app.js`**

Find `cauldronModeConfig` (~line 21) and add `mode: 'cldr'`:

```js
const cauldronModeConfig = {
  mode:       'cldr',
  label:      'Surreal Cauldron',
  backTarget: 'screen-cauldron-config',
  hasFilter:  false,
  renderMode: 'cauldron',
};
```

- [ ] **Step 4: Verify**

Open `http://localhost:8080`, open DevTools console:
```js
jdConfig.mode;             // → 'edl'
ssConfig.mode;             // → 'ss'
cauldronModeConfig.mode;   // → 'cldr'
```

- [ ] **Step 5: Commit**

```bash
git add js/pool.js js/app.js
git commit -m "feat: add mode identifiers to prompt configs"
```

---

## Task 3: HTML structure

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `favorites.js` script tag**

In `index.html`, add before the existing scripts:

```html
<script src="js/favorites.js" defer></script>
<script src="js/utils.js" defer></script>
```

- [ ] **Step 2: Wrap `#prompt-content` in `#prompt-zone`**

Find `<div id="prompt-content" class="prompt-text"></div>` in `screen-prompt` and wrap it:

```html
<div id="prompt-zone">
  <div id="prompt-content" class="prompt-text"></div>
</div>
```

- [ ] **Step 3: Add star button to `screen-prompt`**

Add after the `</div>` closing `prompt-zone`, still inside `screen-prompt`:

```html
<button id="prompt-star-btn" class="star-btn" aria-label="Save to favorites">☆</button>
```

- [ ] **Step 4: Remove `prompt-lock-hint` from document flow and make it a positioned element**

The lock hint is currently `<p id="prompt-lock-hint" class="lock-hint hidden">tap a word to lock it</p>` in the flow. Leave it where it is in the HTML — the CSS in Task 4 will make it `position: absolute`.

- [ ] **Step 5: Add Favorites button to home screen**

Find the `.mode-buttons` div in `#screen-home` and add as the last button:

```html
<button id="btn-favorites" class="mode-btn">Favorites ★</button>
```

- [ ] **Step 6: Add `screen-favorites` screen**

Add after the closing `</div>` of `screen-prompt`, before the scripts:

```html
<!-- Screen: Favorites -->
<div id="screen-favorites" class="screen fav-screen">
  <div class="back-row">
    <button id="btn-favorites-back" class="back-btn">←</button>
    <span class="screen-label">Favorites</span>
  </div>
  <div class="fav-body">
    <p class="fav-warning">Favorites are saved in your browser. Clearing site data will erase them.</p>
    <div class="fav-search-row">
      <input type="search" id="fav-search" class="fav-search" placeholder="search favorites" autocomplete="off">
    </div>
    <div id="fav-list" class="fav-list"></div>
    <div class="fav-footer">
      <button id="fav-export-btn" class="fav-export-btn">⬇ Export</button>
    </div>
  </div>
</div>
```

- [ ] **Step 7: Verify HTML loads without errors**

Open `http://localhost:8080`. Check DevTools console — no errors. Home screen shows four buttons (Everyday Life, Strange Scenes, Surreal Cauldron, Favorites ★). Favorites button is disabled (data not loaded yet, but it will need to work — we'll wire it in Task 8).

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: add favorites HTML — prompt zone, star button, favorites screen"
```

---

## Task 4: CSS

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add prompt zone styles**

Append to `css/style.css`:

```css
/* ── Prompt zone (bounded, never bleeds into controls) ── */
#prompt-zone {
  position: absolute;
  top: 34px;
  bottom: 120px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  overflow: hidden;
}
```

- [ ] **Step 2: Update `.prompt-text` to work inside the zone**

Find the existing `.prompt-text` rule and replace `padding: 0 1rem;` with `width: 100%;` (the zone now handles padding):

```css
.prompt-text {
  font-size: 3.5rem;
  line-height: 1.5;
  max-width: 640px;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}
```

- [ ] **Step 3: Update fixed bottom band positions**

Find and update `.regen-btn` bottom value:
```css
.regen-btn {
  /* existing rules... */
  bottom: 16px;  /* was: bottom: 2rem */
}
```

Find and update `.history-nav` bottom value:
```css
.history-nav {
  /* existing rules... */
  bottom: 48px;  /* was: bottom: 6rem */
}
```

Find and update `.lock-hint` — make it absolutely positioned:
```css
.lock-hint {
  position: absolute;
  bottom: 100px;
  left: 0;
  right: 0;
  font-family: sans-serif;
  font-size: 0.72rem;
  color: #bbb;
  text-align: center;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.3s;
}

.lock-hint.animating {
  opacity: 0;
}
```

Find and update `.pm-tag-indicator` bottom value — it's mutually exclusive with lock-hint (different modes) so can share the same slot:
```css
.pm-tag-indicator {
  /* existing rules... */
  bottom: 100px;  /* was: bottom: 9.5rem */
}
```

- [ ] **Step 4: Add star button styles**

Append to `css/style.css`:

```css
/* ── Star button ── */
.star-btn {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #ddd;
  cursor: pointer;
  text-align: center;
  line-height: 1;
  padding: 0;
  transition: color 0.15s ease;
}

.star-btn.starred {
  color: #e8a030;
}

.star-btn:hover {
  opacity: 0.75;
}
```

- [ ] **Step 5: Add favorites screen styles**

Append to `css/style.css`:

```css
/* ── Favorites screen ── */
.fav-screen {
  justify-content: flex-start;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
}

.fav-body {
  position: absolute;
  top: 3.5rem;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fav-warning {
  flex-shrink: 0;
  font-family: sans-serif;
  font-size: 0.72rem;
  color: #b85c38;
  opacity: 0.7;
  background: rgba(184, 92, 56, 0.07);
  border-bottom: 1px solid rgba(184, 92, 56, 0.15);
  padding: 6px 1.2rem;
  line-height: 1.5;
  text-align: center;
}

.fav-search-row {
  flex-shrink: 0;
  padding: 10px 1.2rem 8px;
  border-bottom: 1px solid #f0e8dc;
}

.fav-search {
  width: 100%;
  font-family: sans-serif;
  font-size: 1rem;
  border: 1.5px solid #d4c8ba;
  border-radius: 20px;
  padding: 6px 14px;
  background: #fff;
  color: #2c2c2c;
  outline: none;
  -webkit-appearance: none;
}

.fav-search:focus {
  border-color: #b85c38;
}

.fav-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.fav-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 1.2rem;
  border-bottom: 1px solid #f5ede4;
}

.fav-item-text {
  flex: 1;
  font-family: 'Caveat', cursive;
  font-size: 1.4rem;
  color: #2c2c2c;
  line-height: 1.3;
  word-break: break-word;
}

.fav-delete-btn {
  flex-shrink: 0;
  font-family: sans-serif;
  font-size: 1rem;
  color: #ccc;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
  margin-top: 2px;
}

.fav-delete-btn:hover {
  color: #b85c38;
}

.fav-empty {
  padding: 3rem 2rem;
  text-align: center;
  font-family: sans-serif;
  font-size: 0.9rem;
  color: #ccc;
  line-height: 1.8;
}

.fav-footer {
  flex-shrink: 0;
  padding: 10px 1.2rem;
  border-top: 1px solid #f0e8dc;
}

.fav-export-btn {
  width: 100%;
  font-family: 'Caveat', cursive;
  font-size: 1.6rem;
  color: #b85c38;
  background: #fdf8f0;
  border: 2px solid #b85c38;
  border-radius: 10px;
  padding: 0.4rem 0;
  cursor: pointer;
  box-shadow: 2px 2px 0 #b85c38;
  transition: box-shadow 0.1s ease, transform 0.1s ease;
}

.fav-export-btn:hover {
  box-shadow: 1px 1px 0 #b85c38;
  transform: translate(1px, 1px);
}

.fav-export-btn:disabled {
  opacity: 0.35;
  cursor: default;
  box-shadow: none;
  transform: none;
}
```

- [ ] **Step 6: Remove dead media query rules**

Find and delete these dead selectors (they reference screens that no longer exist after the shared `screen-prompt` refactor):

```css
#screen-strange-scenes .regen-btn { ... }
#screen-strange-scenes .history-nav { ... }
#screen-strange-scenes .prompt-text { ... }
#screen-just-draw .prompt-text { ... }
```

- [ ] **Step 7: Verify layout in browser**

Open `http://localhost:8080`, click Everyday Life. Check:
- Prompt text is centered in the zone
- Regen button is near the bottom (16px)
- History nav is above it (48px)
- No lock hint visible (correct — Everyday Life mode)
- No layout breakage

- [ ] **Step 8: Commit**

```bash
git add css/style.css
git commit -m "feat: prompt zone layout, fixed bottom band, star button, favorites screen CSS"
```

---

## Task 5: Font auto-scaling (`fitPromptText`)

**Files:**
- Modify: `js/prompt-screen.js`
- Modify: `js/pool.js`

- [ ] **Step 1: Add `fitPromptText()` to `js/prompt-screen.js`**

Add this function near the top of the file, after the `LOCK_SVG` constant:

```js
function fitPromptText() {
  const zone = document.getElementById('prompt-zone');
  const content = document.getElementById('prompt-content');
  if (!zone || !content) return;
  const MAX = 3.5;
  const MIN = 1.0;
  const STEP = 0.2;
  let size = MAX;
  content.style.fontSize = size + 'rem';
  while (content.scrollHeight > zone.clientHeight && size > MIN) {
    size = Math.max(MIN, parseFloat((size - STEP).toFixed(1)));
    content.style.fontSize = size + 'rem';
  }
}
```

- [ ] **Step 2: Call `fitPromptText()` in `navigateHistory()`**

In `js/prompt-screen.js`, find `navigateHistory()`. After the block that sets content (both the `el.textContent` branch and the `renderPrompt()` branch), add calls:

```js
function navigateHistory(direction) {
  // ... existing code ...
  if (activeConfig.renderMode === 'pool') {
    container.textContent = promptHistory[historyIndex];
  } else {
    currentPrompt = promptHistory[historyIndex];
    renderPrompt(container, activeConfig.renderMode);
  }

  fitPromptText();
  if (typeof updateStar === 'function') updateStar();

  container.classList.remove('slide-from-left', 'slide-from-right');
  // ... rest of existing code unchanged ...
}
```

- [ ] **Step 3: Call `fitPromptText()` in `regenPoolMode()` in `js/pool.js`**

Find `regenPoolMode()` in pool.js. After `el.textContent = finalValue` and BEFORE `animateSlot()`, add:

```js
function regenPoolMode(cfg) {
  const finalValue = generateFromPool(cfg);
  const el = document.getElementById('prompt-content');
  el.textContent = finalValue;
  fitPromptText();
  if (typeof updateStar === 'function') updateStar();
  animateSlot(el, cfg.getNames(), finalValue, 1200);
  pushToHistory(finalValue);
  renderHistoryWidget();
}
```

- [ ] **Step 4: Verify auto-scaling in browser**

Open `http://localhost:8080`. Click Everyday Life and generate prompts until you see a very long one (e.g., the Danny Gregory prompts can be 100+ chars). Confirm:
- Short prompts: large font (~3.5rem)
- Long prompts: smaller font, but fully readable, nothing clipped
- Bottom band (regen, nav) never moves

- [ ] **Step 5: Commit**

```bash
git add js/prompt-screen.js js/pool.js
git commit -m "feat: auto-scale prompt font to fit zone, call on render and history nav"
```

---

## Task 6: Star button — wiring and entry building

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add `updateStar()` to `js/app.js`**

Add near the top of `js/app.js`, after the state variable declarations:

```js
function updateStar() {
  const btn = document.getElementById('prompt-star-btn');
  if (!btn) return;
  const text = document.getElementById('prompt-content').textContent.trim();
  const faved = text && Favorites.isFavorite(text);
  btn.textContent = faved ? '★' : '☆';
  btn.classList.toggle('starred', !!faved);
}
```

- [ ] **Step 2: Add `buildFavoriteEntry()` to `js/app.js`**

Add immediately after `updateStar()`:

```js
function buildFavoriteEntry(text) {
  const entry = { text, mode: activeConfig.mode };
  if (activeConfig.mode === 'cldr' && cauldronConfig) {
    entry.preset = cauldronConfig.preset;
    entry.slots = cauldronConfig.slots
      .filter(s => s.enabled)
      .map(s => ({ adjective: 'adj', noun: 'noun', verb: 'verb', environment: 'env' }[s.type] || s.type));
  }
  return entry;
}
```

- [ ] **Step 3: Wire the star button click handler**

Add to the event wiring section in `js/app.js`:

```js
document.getElementById('prompt-star-btn').addEventListener('click', () => {
  const text = document.getElementById('prompt-content').textContent.trim();
  if (!text) return;
  if (Favorites.isFavorite(text)) {
    Favorites.remove(text);
  } else {
    Favorites.add(buildFavoriteEntry(text));
  }
  updateStar();
});
```

- [ ] **Step 4: Call `updateStar()` after Cauldron generate**

In the `cc-generate` click handler, add `updateStar()` after `renderPrompt()`:

```js
document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
  enterMode(cauldronModeConfig);
  const container = document.getElementById('prompt-content');
  renderPrompt(container, 'cauldron');
  fitPromptText();
  updateStar();
  // ... rest of existing handler unchanged ...
});
```

- [ ] **Step 5: Call `fitPromptText()` and `updateStar()` after Cauldron regen**

In the `prompt-regen-btn` click handler, add after `renderPrompt()` in the cauldron branch:

```js
document.getElementById('prompt-regen-btn').addEventListener('click', () => {
  if (activeConfig.renderMode === 'pool') {
    regenPoolMode(activeConfig);
  } else {
    const container = document.getElementById('prompt-content');
    currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
    renderPrompt(container, 'cauldron');
    fitPromptText();
    updateStar();
    // ... rest of existing handler unchanged ...
  }
});
```

- [ ] **Step 6: Verify star behavior in browser**

Open `http://localhost:8080`. Test each scenario:
1. Generate an Everyday Life prompt → star shows ☆
2. Tap ☆ → turns ★, prompt saved to `localStorage.getItem('promptlab_favorites')`
3. Tap ★ → turns ☆, prompt removed from localStorage
4. Star a prompt, click ↺ new prompt → star resets to ☆ for new prompt
5. Navigate back with ‹ to starred prompt → star shows ★
6. Navigate forward → star shows ☆ again
7. Repeat for Surreal Cauldron mode

- [ ] **Step 7: Commit**

```bash
git add js/app.js
git commit -m "feat: wire star button — updateStar, buildFavoriteEntry, click handler"
```

---

## Task 7: `Favorites.renderScreen()` — list, search, delete, export

**Files:**
- Modify: `js/favorites.js`

- [ ] **Step 1: Replace the `renderScreen` stub with the full implementation**

Replace the `function renderScreen() { // implemented in Task 7 }` stub:

```js
function renderScreen() {
  const query = (document.getElementById('fav-search')?.value || '').toLowerCase().trim();
  const all = load();
  const items = query
    ? all.filter(e => e.text.toLowerCase().includes(query))
    : all;

  const list = document.getElementById('fav-list');
  list.innerHTML = '';

  if (all.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'fav-empty';
    empty.textContent = 'No favorites yet — star a prompt to save it ★';
    list.appendChild(empty);
    document.getElementById('fav-export-btn').disabled = true;
    return;
  }

  document.getElementById('fav-export-btn').disabled = false;

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'fav-empty';
    empty.textContent = 'No matches';
    list.appendChild(empty);
    return;
  }

  items.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'fav-item';

    const text = document.createElement('span');
    text.className = 'fav-item-text';
    text.textContent = entry.text;
    row.appendChild(text);

    const del = document.createElement('button');
    del.className = 'fav-delete-btn';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Remove from favorites');
    del.addEventListener('click', () => {
      remove(entry.text);
      renderScreen();
    });
    row.appendChild(del);

    list.appendChild(row);
  });
}
```

- [ ] **Step 2: Verify `renderScreen()` in browser console**

With the app open, in DevTools console:

```js
Favorites.add({ text: 'a red fox in fog', mode: 'edl' });
Favorites.add({ text: 'a melting clock on a bicycle', mode: 'edl' });
// Then navigate to Favorites screen (after Task 8) — or test renderScreen directly:
// showScreen('screen-favorites'); Favorites.renderScreen();
```

- [ ] **Step 3: Commit**

```bash
git add js/favorites.js
git commit -m "feat: implement Favorites.renderScreen with list, search, delete, empty states"
```

---

## Task 8: Wire favorites screen navigation

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Wire the Favorites home button**

Add to the event wiring section in `js/app.js`:

```js
document.getElementById('btn-favorites').addEventListener('click', () => {
  Favorites.renderScreen();
  showScreen('screen-favorites');
});
```

- [ ] **Step 2: Wire the back button and search input**

Add after the Favorites button handler:

```js
document.getElementById('btn-favorites-back').addEventListener('click', () => {
  showScreen('screen-home');
});

document.getElementById('fav-search').addEventListener('input', () => {
  Favorites.renderScreen();
});

document.getElementById('fav-export-btn').addEventListener('click', () => {
  Favorites.exportToFile();
});
```

- [ ] **Step 3: Enable the Favorites home button after data loads**

In the `init()` function in `js/app.js`, the existing code enables mode buttons after data loads. Add the Favorites button (it doesn't need data but should follow the same pattern for consistency):

```js
document.getElementById('btn-favorites').disabled = false;
```

Add this line alongside the other `disabled = false` lines in the `try` block of `init()`.

- [ ] **Step 4: Full end-to-end verification**

Open `http://localhost:8080` and run through this checklist:

**Favorites screen:**
- [ ] Favorites button appears on home screen as the last button
- [ ] Tapping Favorites → navigates to Favorites screen
- [ ] Empty state shows `"No favorites yet — star a prompt to save it ★"`
- [ ] Export button is disabled when list is empty
- [ ] Back button → returns to home screen

**Starring prompts:**
- [ ] Generate an Everyday Life prompt, star it → ★ lit, saved to localStorage
- [ ] Navigate to Favorites screen → prompt appears in list
- [ ] Generate a Strange Scenes prompt, star it → appears in Favorites
- [ ] Generate a Surreal Cauldron prompt, star it → entry has `mode: 'cldr'`, `preset`, `slots` in localStorage
- [ ] Tap ★ again → un-stars, removed from Favorites list

**Search:**
- [ ] Type in search box → list filters live
- [ ] Clear search → full list returns
- [ ] Search with no matches → shows `"No matches"`

**Delete:**
- [ ] Tap × on a favorite → removes it immediately, list re-renders

**Export:**
- [ ] With favorites saved, tap Export → downloads `promptlab-favorites.txt`
- [ ] Open the file — one prompt per line, plain text, no JSON

**History + star state:**
- [ ] Star a prompt, regen new prompt → star resets to ☆
- [ ] Navigate back with ‹ → star shows ★ for the previously starred prompt
- [ ] Navigate forward → star shows ☆

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "feat: wire favorites screen navigation, search, export"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ `favorites.js` module with all specified API functions
- ✅ Mode identifiers `edl`, `ss`, `cldr` on config objects
- ✅ Metadata schema: `{ text, mode, preset?, slots? }`
- ✅ Prompt zone bounded, `top: 34px`, `bottom: 120px`
- ✅ Bottom band: lock hint 100px, star 80px, nav 48px, regen 16px — all absolute
- ✅ `fitPromptText()` — 3.5rem → 1rem, 0.2rem steps
- ✅ Star re-evaluates on generate, regen, history navigation
- ✅ Star visible in all three modes (edl, ss, cldr)
- ✅ Favorites home button as last button
- ✅ Warning banner always visible
- ✅ Search: live, case-insensitive, substring
- ✅ Empty states: no favorites / no matches
- ✅ Delete: immediate, re-renders list
- ✅ Export: plain text, one per line, filename `promptlab-favorites.txt`
- ✅ Export disabled when list is empty
- ✅ No import, no clear-all
