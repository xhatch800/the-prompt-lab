# Split app.js Into Focused Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break the 1048-line `app.js` into five focused files under `js/`, move `style.css` into `css/`, and update `index.html` to reference the new paths.

**Architecture:** Plain `<script defer>` tags, no bundler, no module syntax. All variables remain global. New files are created alongside the old `app.js` first; `index.html` is switched over in the final task so the app stays working until the cutover.

**Tech Stack:** Vanilla JS, Python HTTP server for local testing.

---

## File Map

| Old | New |
|-----|-----|
| `style.css` | `css/style.css` |
| `app.js` (lines 4–27, 192–197) | `js/utils.js` |
| `app.js` (lines 199–570) | `js/cauldron.js` |
| `app.js` (lines 592–623, 725–831) | `js/pool.js` |
| `app.js` (lines 28–39, 51–189, 572–579, 634–724, 899–996) | `js/prompt-screen.js` |
| `app.js` (lines 1–2, 581–591, 624–632, 833–897, 931–1048) | `js/app.js` |
| `app.js` (lines 41–49) | deleted — dead code (`generateSurrealNarrative`) |

---

### Task 1: Move CSS into `css/`

**Files:**
- Create: `css/style.css`
- Modify: `index.html` (CSS link)
- Delete: `style.css`

- [ ] **Step 1: Create the `css/` directory and copy `style.css` into it**

```bash
mkdir css
cp style.css css/style.css
```

- [ ] **Step 2: Update the `<link>` in `index.html`**

Find in `index.html`:
```html
  <link rel="stylesheet" href="style.css">
```
Replace with:
```html
  <link rel="stylesheet" href="css/style.css">
```

- [ ] **Step 3: Verify in browser**

```bash
# server should already be running at port 8080
# open http://localhost:8080 and confirm the app looks identical
# check DevTools → Network: no 404s
```

- [ ] **Step 4: Delete the old file and commit**

```bash
rm style.css
git add css/style.css style.css index.html
git commit -m "refactor: move style.css into css/"
```

---

### Task 2: Create `js/utils.js`

**Files:**
- Create: `js/utils.js`

- [ ] **Step 1: Create the `js/` directory and write `js/utils.js`**

```bash
mkdir js
```

Create `js/utils.js` with this exact content:

```js
// ── Utilities ───────────────────────────────────────────────
function pick(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawFromDeck(deck, pool) {
  if (!pool || pool.length === 0) return '';
  if (deck.length === 0) {
    const reshuffled = shuffle(pool);
    deck.push(...reshuffled);
  }
  return deck.pop();
}

function filterByTags(pool, tags, tagMode) {
  if (!tags || tags.length === 0) return pool;
  return tagMode === 'all'
    ? pool.filter(item => tags.every(t => item.tags.includes(t)))
    : pool.filter(item => tags.some(t => item.tags.includes(t)));
}
```

Note: `filterByTags` is moved here from the cauldron helpers section (line 192 of `app.js`) — it is a pure function used by both `cauldron.js` and `pool.js`.

- [ ] **Step 2: Commit**

```bash
git add js/utils.js
git commit -m "refactor: extract utility functions into js/utils.js"
```

---

### Task 3: Create `js/cauldron.js`

**Files:**
- Create: `js/cauldron.js`

- [ ] **Step 1: Create `js/cauldron.js`**

Create `js/cauldron.js` with this exact content (copied from `app.js` lines 199–570, indentation normalized):

```js
// ── Cauldron helpers ─────────────────────────────────────────
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
  const usedNames = {};

  for (const slot of activeSlots) {
    if (locked[slot.id] && prev[slot.id] != null) {
      result[slot.id] = prev[slot.id];
      if (slot.type === 'noun' && prev[slot.id]) {
        const poolKey = slot.pool;
        if (!usedNames[poolKey]) usedNames[poolKey] = new Set();
        usedNames[poolKey].add(prev[slot.id]);
      }
      continue;
    }

    if (slot.type === 'adjective') {
      if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
      result[slot.id] = drawFromDeck(cauldronDecks[slot.id], store.adjectives);

    } else if (slot.type === 'noun') {
      const fullPool = slot.pool === 'organic'   ? store.nounsOrganicFull
                     : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                     : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
      const filtered = filterByTags(fullPool, slot.tags ?? [], slot.tagMode);
      const candidates = filtered.length ? filtered : fullPool;
      const poolKey = slot.pool;
      if (!usedNames[poolKey]) usedNames[poolKey] = new Set();
      const deduped = candidates.filter(n => !usedNames[poolKey].has(n.name));
      const drawPool = (deduped.length ? deduped : candidates).map(n => n.name);
      if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
      const chosen = drawFromDeck(cauldronDecks[slot.id], drawPool);
      result[slot.id] = chosen;
      usedNames[poolKey].add(chosen);

    } else if (slot.type === 'verb') {
      const filtered = filterByTags(store.verbsFull, slot.tags ?? [], slot.tagMode);
      const verbPool = (filtered.length ? filtered : store.verbsFull).map(i => i.name);
      if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
      result[slot.id] = drawFromDeck(cauldronDecks[slot.id], verbPool);

    } else if (slot.type === 'environment') {
      const filtered = filterByTags(store.environmentsFull, slot.tags ?? [], slot.tagMode);
      const envPool = (filtered.length ? filtered : store.environmentsFull).map(i => i.name);
      if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
      result[slot.id] = drawFromDeck(cauldronDecks[slot.id], envPool);
    }
  }
  return result;
}

function buildSlotRow(slot, isStrange) {
  const div = document.createElement('div');
  div.className = 'cc-slot';

  const header = document.createElement('div');
  header.className = 'cc-slot-header';

  const nameEl = document.createElement('span');
  nameEl.className = 'cc-slot-name';
  const nounNum = slot.id.startsWith('noun_') ? parseInt(slot.id.split('_')[1], 10) : null;
  nameEl.textContent = slot.type === 'noun'
    ? (nounNum === 1 ? 'Noun' : `Noun ${nounNum}`)
    : slot.type.charAt(0).toUpperCase() + slot.type.slice(1);
  header.appendChild(nameEl);

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

  if (slot.type !== 'adjective' && slot.tags && slot.tags.length > 0) {
    let pool;
    if (slot.type === 'noun') {
      const full = slot.pool === 'organic'   ? store.nounsOrganicFull
                 : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                 : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
      pool = filterByTags(full, slot.tags, slot.tagMode);
    } else if (slot.type === 'verb') {
      pool = filterByTags(store.verbsFull, slot.tags, slot.tagMode);
    } else if (slot.type === 'environment') {
      pool = filterByTags(store.environmentsFull, slot.tags, slot.tagMode);
    }
    if (pool !== undefined) {
      const count = pool.length;
      const badge = document.createElement('span');
      badge.className = 'cc-match-badge' + (count === 0 ? ' cc-match-zero' : '');
      badge.textContent = count === 0 ? '0 matches' : `${count} matches`;
      header.appendChild(badge);
    }
  }

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

  if (slot.type === 'adjective') {
    const note = document.createElement('span');
    note.className = 'cc-untagged-note';
    note.textContent = 'untagged — fully random';
    div.appendChild(note);
    return div;
  }

  if (slot.type === 'noun') {
    const poolDiv = document.createElement('div');
    poolDiv.className = 'cc-pool-toggle';
    ['organic', 'either', 'synthetic'].forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'cc-pool-btn' + (slot.pool === p ? ' active' : '');
      btn.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      btn.addEventListener('click', () => {
        slot.pool = p;
        slot.tags = [];
        slot.tagMode = 'any';
        openTagPickerSlotId = null;
        renderCauldronConfig();
      });
      poolDiv.appendChild(btn);
    });
    div.appendChild(poolDiv);
  }

  const tagsArea = document.createElement('div');
  tagsArea.className = 'cc-tags-area';

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

function renderCauldronConfig() {
  const isStrange = cauldronConfig.preset === 'strange';

  document.getElementById('cc-preset-surreal').classList.toggle('active', !isStrange);
  document.getElementById('cc-preset-strange').classList.toggle('active', isStrange);

  const slotsContainer = document.getElementById('cc-slots');
  slotsContainer.innerHTML = '';

  const activeSlots = cauldronConfig.slots.filter(s => s.enabled);
  activeSlots.forEach(slot => {
    slotsContainer.appendChild(buildSlotRow(slot, isStrange));
  });

  const nounCount = cauldronConfig.slots.filter(s => s.type === 'noun' && s.enabled).length;
  if (nounCount < 4) {
    const addNounBtn = document.createElement('button');
    addNounBtn.className = 'cc-add-noun';
    addNounBtn.textContent = '+ add another Noun';
    addNounBtn.addEventListener('click', () => {
      const usedNums = cauldronConfig.slots.filter(s => s.id.startsWith('noun_')).map(s => parseInt(s.id.split('_')[1], 10));
      const nextNum = (usedNums.length ? Math.max(...usedNums) : 0) + 1;
      const lastNounIdx = cauldronConfig.slots.reduce((acc, s, i) => s.type === 'noun' ? i : acc, -1);
      const newSlot = { id: `noun_${nextNum}`, type: 'noun', enabled: true, pool: 'either', tags: [], tagMode: 'any' };
      cauldronConfig.slots.splice(lastNounIdx + 1, 0, newSlot);
      renderCauldronConfig();
    });
    slotsContainer.appendChild(addNounBtn);
  }

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
          const existing = cauldronConfig.slots.find(s => s.type === type);
          if (existing) {
            existing.enabled = true;
          } else {
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

  const hasZeroMatch = activeSlots.some(slot => {
    if (slot.type === 'adjective' || !slot.tags || slot.tags.length === 0) return false;
    let pool;
    if (slot.type === 'noun') {
      const full = slot.pool === 'organic'   ? store.nounsOrganicFull
                 : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                 : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
      pool = filterByTags(full, slot.tags, slot.tagMode);
    } else if (slot.type === 'verb') {
      pool = filterByTags(store.verbsFull, slot.tags, slot.tagMode);
    } else if (slot.type === 'environment') {
      pool = filterByTags(store.environmentsFull, slot.tags, slot.tagMode);
    }
    return pool !== undefined && pool.length === 0;
  });
  document.getElementById('cc-generate').disabled = activeSlots.length === 0 || hasZeroMatch;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/cauldron.js
git commit -m "refactor: extract cauldron logic into js/cauldron.js"
```

---

### Task 4: Create `js/pool.js`

**Files:**
- Create: `js/pool.js`

- [ ] **Step 1: Create `js/pool.js`**

Create `js/pool.js` with this exact content:

```js
// ── Pool-mode configs ─────────────────────────────────────────
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

// ── Pool-mode functions ───────────────────────────────────────
function generateFromPool(cfg) {
  const fullPool = cfg.getPool();
  const pool = cfg.activeTags.length === 0
    ? fullPool
    : filterByTags(fullPool, cfg.activeTags, cfg.tagMode);
  const item = drawFromDeck(cfg.deck, pool.length > 0 ? pool : fullPool);
  return item ? item[cfg.textField] : '';
}

function regenPoolMode(cfg) {
  const finalValue = generateFromPool(cfg);
  const el = document.getElementById('prompt-content');
  el.textContent = finalValue;
  animateSlot(el, cfg.getNames(), finalValue, 1200);
  pushToHistory(finalValue);
  renderHistoryWidget();
}

function renderFilterSheet(cfg) {
  const chipsEl     = document.getElementById('prompt-tag-chips');
  const anyAllRow   = document.getElementById('prompt-any-all-row');
  const poolCountEl = document.getElementById('prompt-pool-count');
  const applyBtn    = document.getElementById('prompt-apply-btn');
  const aaBtns      = anyAllRow.querySelectorAll('.pm-aa-btn');

  document.getElementById('prompt-sheet-title').textContent = cfg.sheetTitle;

  const tags = [...new Set(cfg.getPool().flatMap(item => item.tags || []))].sort();
  chipsEl.innerHTML = '';
  tags.forEach(tag => {
    const chip = document.createElement('button');
    chip.className = 'pm-chip' + (cfg.sheetTags.includes(tag) ? ' on' : '');
    chip.textContent = tag.replace('_', ' ');
    chip.addEventListener('click', () => {
      if (cfg.sheetTags.includes(tag)) {
        cfg.sheetTags = cfg.sheetTags.filter(t => t !== tag);
        if (cfg.sheetTags.length === 0) cfg.sheetMode = 'any';
      } else {
        cfg.sheetTags = [...cfg.sheetTags, tag];
      }
      renderFilterSheet(cfg);
    });
    chipsEl.appendChild(chip);
  });

  anyAllRow.classList.toggle('hidden', cfg.sheetTags.length === 0);
  aaBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === cfg.sheetMode));

  const count = cfg.sheetTags.length === 0
    ? cfg.getPool().length
    : filterByTags(cfg.getPool(), cfg.sheetTags, cfg.sheetMode).length;
  poolCountEl.textContent = cfg.sheetTags.length > 0 ? `${count} prompts` : '';

  let warning = chipsEl.parentElement.querySelector('.pm-empty-warning');
  if (count === 0 && cfg.sheetTags.length > 0) {
    if (!warning) {
      warning = document.createElement('p');
      warning.className = 'pm-empty-warning';
      warning.textContent = "no prompts match — try 'any' or fewer tags";
      document.getElementById('prompt-any-all-row').after(warning);
    }
  } else if (warning) {
    warning.remove();
  }

  applyBtn.disabled = count === 0;
}

function openFilterSheet(cfg) {
  cfg.sheetTags = [...cfg.activeTags];
  cfg.sheetMode = cfg.tagMode;
  document.getElementById('prompt-filter-backdrop').classList.add('visible');
  document.getElementById('prompt-filter-sheet').classList.remove('hidden');
  document.getElementById('prompt-filter-btn').classList.add('active');
  renderFilterSheet(cfg);
}

function closeFilterSheet(cfg) {
  document.getElementById('prompt-filter-backdrop').classList.remove('visible');
  document.getElementById('prompt-filter-sheet').classList.add('hidden');
}

function applyFilter(cfg) {
  cfg.activeTags = [...cfg.sheetTags];
  cfg.tagMode    = cfg.sheetMode;
  cfg.deck       = [];
  closeFilterSheet(cfg);
  updateFilterBtn(cfg);
  updateTagIndicator(cfg);
}

function updateFilterBtn(cfg) {
  document.getElementById('prompt-filter-btn')
    .classList.toggle('active', cfg.activeTags.length > 0);
}

function updateTagIndicator(cfg) {
  const el = document.getElementById('prompt-tag-indicator');
  if (cfg.activeTags.length === 0) {
    el.textContent = '';
  } else {
    const labels = cfg.activeTags.map(t => t.replace('_', ' ')).join(', ');
    el.textContent = `${cfg.tagMode}: ${labels}`;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/pool.js
git commit -m "refactor: extract pool-mode logic into js/pool.js"
```

---

### Task 5: Create `js/prompt-screen.js`

**Files:**
- Create: `js/prompt-screen.js`

- [ ] **Step 1: Create `js/prompt-screen.js`**

Create `js/prompt-screen.js` with this exact content:

```js
// ── Screen management ────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('wallpaper-layer')
    .classList.toggle('dimmed', id === 'screen-prompt');
  if (id !== 'screen-prompt' && id !== 'screen-cauldron-config') {
    currentPrompt = null;
    lockedSlots = {};
    clearHistory();
  }
}

// ── Prompt rendering ─────────────────────────────────────────
const LOCK_SVG = '<svg class="lock-icon" width="16" height="18" viewBox="0 0 16 18" fill="none"><rect x="1" y="8" width="14" height="10" rx="2" stroke="#b85c38" stroke-width="2"/><path d="M4 8V6a4 4 0 0 1 8 0v2" stroke="#b85c38" stroke-width="2" stroke-linecap="round"/></svg>';

function renderPrompt(container, mode) {
  container.innerHTML = '';

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

    const regenBtn = document.getElementById('prompt-regen-btn');
    if (regenBtn) {
      const allLocked = activeSlots.length > 0 &&
        activeSlots.every(s => lockedSlots[s.id]);
      regenBtn.disabled = allLocked;
    }
    return;
  }

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

function animateSlot(el, pool, finalValue, durationMs) {
  if (el.classList.contains('locked')) return;
  const gen = (el.__animGen = (el.__animGen || 0) + 1);
  el.classList.add('animating');
  let elapsed = 0;
  let intervalTime = 55;

  function tick() {
    if (el.__animGen !== gen) return;
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
      setTimeout(() => {
        if (el.__animGen !== gen) return;
        el.style.transform = 'scale(1)';
        setTimeout(() => {
          if (el.__animGen === gen) {
            el.style.transition = '';
            el.style.transform = '';
          }
        }, 130);
      }, 130);
      return;
    }
    setTimeout(tick, intervalTime);
  }
  tick();
}

function animateUnlockedSlots(container) {
  if (!currentPrompt) return;

  if (activeConfig && activeConfig.renderMode === 'cauldron' && cauldronConfig) {
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
        const filtered = filterByTags(full, slotDef.tags ?? [], slotDef.tagMode);
        pool = (filtered.length ? filtered : full).map(n => n.name);
      } else if (slotDef.type === 'verb') {
        const filtered = filterByTags(store.verbsFull, slotDef.tags ?? [], slotDef.tagMode);
        pool = (filtered.length ? filtered : store.verbsFull).map(n => n.name);
      } else if (slotDef.type === 'environment') {
        const filtered = filterByTags(store.environmentsFull, slotDef.tags ?? [], slotDef.tagMode);
        pool = (filtered.length ? filtered : store.environmentsFull).map(n => n.name);
      }
      if (pool && pool.length > 0) animateSlot(span, pool, currentPrompt[slotId], 1200);
    });
    return;
  }

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

function toggleLock(slot, container, mode) {
  if (lockedSlots[slot]) {
    delete lockedSlots[slot];
  } else {
    lockedSlots[slot] = true;
  }
  renderPrompt(container, mode);
}

// ── History helpers ──────────────────────────────────────────
function clearHistory() {
  promptHistory = [];
  historyIndex = -1;
  document.getElementById('prompt-history-nav').classList.remove('visible');
}

function enterMode(config) {
  activeConfig = config;
  document.getElementById('prompt-screen-label').textContent = config.label;
  document.getElementById('prompt-back-btn').dataset.target = config.backTarget;

  const hasFilter = config.hasFilter;
  document.getElementById('prompt-filter-btn').classList.toggle('hidden', !hasFilter);
  document.getElementById('prompt-tag-indicator').classList.toggle('hidden', !hasFilter);
  document.getElementById('prompt-filter-sheet').classList.add('hidden');
  document.getElementById('prompt-filter-backdrop').classList.remove('visible');

  const hasLock = config.renderMode === 'cauldron';
  document.getElementById('prompt-lock-hint').classList.toggle('hidden', !hasLock);

  showScreen('screen-prompt');
}

function pushToHistory(prompt) {
  promptHistory.push(prompt);
  if (promptHistory.length > HISTORY_MAX) {
    promptHistory.shift();
  }
  historyIndex = promptHistory.length - 1;
}

function renderHistoryWidget() {
  const nav = document.getElementById('prompt-history-nav');
  const dotsContainer = document.getElementById('prompt-hist-dots');
  const prevBtn = document.getElementById('prompt-hist-prev');
  const nextBtn = document.getElementById('prompt-hist-next');

  if (promptHistory.length <= 1) {
    nav.classList.remove('visible');
    return;
  }

  nav.classList.add('visible');

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

function navigateHistory(direction) {
  const newIndex = historyIndex + direction;
  const container = document.getElementById('prompt-content');
  if (newIndex < 0 || newIndex >= promptHistory.length) {
    if (promptHistory.length > 1) {
      const cls = direction === -1 ? 'bounce-right' : 'bounce-left';
      container.classList.remove('bounce-left', 'bounce-right');
      void container.offsetWidth;
      container.classList.add(cls);
      setTimeout(() => container.classList.remove(cls), 380);
    }
    return;
  }
  historyIndex = newIndex;

  if (activeConfig.renderMode === 'pool') {
    container.textContent = promptHistory[historyIndex];
  } else {
    currentPrompt = promptHistory[historyIndex];
    renderPrompt(container, activeConfig.renderMode);
  }

  container.classList.remove('slide-from-left', 'slide-from-right');
  void container.offsetWidth;
  container.classList.add(direction === -1 ? 'slide-from-left' : 'slide-from-right');

  renderHistoryWidget();
}

// ── Copy button + swipe gestures ─────────────────────────────
function setupCopyBtn(btnId, getTextFn) {
  const btn = document.getElementById(btnId);
  btn.addEventListener('click', async () => {
    const text = getTextFn();
    if (!text) return;
    let success = false;
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-999px;left:-999px';
        document.body.appendChild(ta);
        ta.select();
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e2) { /* nothing we can do */ }
    }
    if (success) {
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '⧉';
        btn.classList.remove('copied');
      }, 1500);
    }
  });
}

const SWIPE_THRESHOLD = 40;

function addSwipe(elementId) {
  let startX = null;
  const el = document.getElementById(elementId);
  el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (startX === null) return;
    const delta = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    navigateHistory(delta < 0 ? 1 : -1);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add js/prompt-screen.js
git commit -m "refactor: extract prompt screen logic into js/prompt-screen.js"
```

---

### Task 6: Create `js/app.js`

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Create `js/app.js`**

Create `js/app.js` with this exact content (state + cauldronModeConfig + all event wiring + init):

```js
// ── Data store ──────────────────────────────────────────────
const store = {};

// ── State ────────────────────────────────────────────────────
let cauldronConfig = null;
let openTagPickerSlotId = null;
let activeConfig = null;
let currentPrompt = null;
let lockedSlots = {};

const HISTORY_MAX = 20;
let promptHistory = [];
let historyIndex = -1;

let cauldronDecks = {};

// ── Cauldron prompt-screen mode config ───────────────────────
const cauldronModeConfig = {
  label:      'Surreal Cauldron',
  backTarget: 'screen-cauldron-config',
  hasFilter:  false,
  renderMode: 'cauldron',
};

// ── Event wiring ─────────────────────────────────────────────
document.getElementById('btn-just-draw').addEventListener('click', () => {
  clearHistory();
  jdConfig.deck       = [];
  jdConfig.activeTags = [];
  jdConfig.tagMode    = 'any';
  updateFilterBtn(jdConfig);
  updateTagIndicator(jdConfig);
  enterMode(jdConfig);
  regenPoolMode(jdConfig);
});

document.getElementById('btn-strange-scenes').addEventListener('click', () => {
  clearHistory();
  ssConfig.deck       = [];
  ssConfig.activeTags = [];
  ssConfig.tagMode    = 'any';
  updateFilterBtn(ssConfig);
  updateTagIndicator(ssConfig);
  enterMode(ssConfig);
  regenPoolMode(ssConfig);
});

document.getElementById('btn-cauldron').addEventListener('click', () => {
  clearHistory();
  lockedSlots = {};
  initCauldronConfig('surreal');
  renderCauldronConfig();
  showScreen('screen-cauldron-config');
});

document.getElementById('btn-cauldron-back').addEventListener('click', () => {
  cauldronConfig = null;
  openTagPickerSlotId = null;
  showScreen('screen-home');
});

document.getElementById('cc-preset-surreal').addEventListener('click', () => {
  initCauldronConfig('surreal');
  renderCauldronConfig();
});

document.getElementById('cc-preset-strange').addEventListener('click', () => {
  initCauldronConfig('strange');
  renderCauldronConfig();
});

document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  cauldronDecks = {};
  currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
  enterMode(cauldronModeConfig);
  const container = document.getElementById('prompt-content');
  renderPrompt(container, 'cauldron');
  const hint = document.getElementById('prompt-lock-hint');
  hint.classList.add('animating');
  animateUnlockedSlots(container);
  setTimeout(() => hint.classList.remove('animating'), 1200);
  pushToHistory(currentPrompt);
  renderHistoryWidget();
});

document.querySelectorAll('.back-btn[data-target]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.target));
});

// ── Shared prompt screen event wiring ────────────────────────
document.getElementById('prompt-filter-btn').addEventListener('click', () => openFilterSheet(activeConfig));
document.getElementById('prompt-filter-backdrop').addEventListener('click', () => {
  closeFilterSheet(activeConfig);
  updateFilterBtn(activeConfig);
});
document.getElementById('prompt-clear-btn').addEventListener('click', () => {
  activeConfig.sheetTags = [];
  activeConfig.sheetMode = 'any';
  renderFilterSheet(activeConfig);
});
document.getElementById('prompt-apply-btn').addEventListener('click', () => {
  applyFilter(activeConfig);
  regenPoolMode(activeConfig);
});
document.querySelectorAll('#prompt-any-all-row .pm-aa-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeConfig.sheetMode = btn.dataset.mode;
    renderFilterSheet(activeConfig);
  });
});

document.getElementById('prompt-regen-btn').addEventListener('click', () => {
  if (activeConfig.renderMode === 'pool') {
    regenPoolMode(activeConfig);
  } else {
    const container = document.getElementById('prompt-content');
    currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
    renderPrompt(container, 'cauldron');
    const hint = document.getElementById('prompt-lock-hint');
    hint.classList.add('animating');
    animateUnlockedSlots(container);
    setTimeout(() => hint.classList.remove('animating'), 1200);
    pushToHistory(currentPrompt);
    renderHistoryWidget();
  }
});

document.getElementById('prompt-back-btn').addEventListener('click', () => {
  showScreen(activeConfig.backTarget);
});

document.getElementById('prompt-hist-prev').addEventListener('click', () => navigateHistory(-1));
document.getElementById('prompt-hist-next').addEventListener('click', () => navigateHistory(1));

setupCopyBtn('prompt-copy-btn', () =>
  document.getElementById('prompt-content').textContent.trim()
);

addSwipe('prompt-content');

// ── Data loading ─────────────────────────────────────────────
async function init() {
  try {
    const [justDraw, strangeScenes, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw] =
      await Promise.all([
        fetch('data/just_draw_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('data/strange_scenes.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('data/adjectives.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('data/nouns_organic_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('data/nouns_synthetic_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('data/verbs_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('data/environments_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      ]);

    if ([justDraw, strangeScenes, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw]
        .some(d => !Array.isArray(d) || d.length === 0)) {
      throw new Error('Empty data');
    }

    store.justDraw            = justDraw;
    store.justDrawNames       = justDraw.map(i => i.name);
    store.strangeScenes       = strangeScenes;
    store.strangeSceneTexts   = strangeScenes.map(i => i.text);
    store.adjectives          = adjectives;
    store.nounsOrganic        = nounsOrganicRaw.map(i => i.name);
    store.nounsSynthetic      = nounsSyntheticRaw.map(i => i.name);
    store.verbs               = verbsRaw.map(i => i.name);
    store.environments        = environmentsRaw.map(i => i.name);
    store.nounsOrganicFull    = nounsOrganicRaw;
    store.nounsSyntheticFull  = nounsSyntheticRaw;
    store.verbsFull           = verbsRaw;
    store.environmentsFull    = environmentsRaw;
    store.nounsOrganicTags    = [...new Set(nounsOrganicRaw.flatMap(i => i.tags))].sort();
    store.nounsSyntheticTags  = [...new Set(nounsSyntheticRaw.flatMap(i => i.tags))].sort();
    store.verbsTags           = [...new Set(verbsRaw.flatMap(i => i.tags))].sort();
    store.environmentsTags    = [...new Set(environmentsRaw.flatMap(i => i.tags))].sort();
    document.getElementById('btn-just-draw').disabled = false;
    document.getElementById('btn-cauldron').disabled = false;
    document.getElementById('btn-strange-scenes').disabled = false;
  } catch {
    document.getElementById('error-banner').classList.remove('hidden');
    document.getElementById('btn-just-draw').disabled = true;
    document.getElementById('btn-cauldron').disabled = true;
    document.getElementById('btn-strange-scenes').disabled = true;
  }
}

init();
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "refactor: create js/app.js with state, event wiring, and init"
```

---

### Task 7: Switch index.html to new files and delete old app.js

**Files:**
- Modify: `index.html`
- Delete: `app.js`

- [ ] **Step 1: Replace the script tag in `index.html`**

Find in `index.html`:
```html
  <script src="app.js" defer></script>
```
Replace with:
```html
  <script src="js/utils.js" defer></script>
  <script src="js/cauldron.js" defer></script>
  <script src="js/pool.js" defer></script>
  <script src="js/prompt-screen.js" defer></script>
  <script src="js/app.js" defer></script>
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8080` (hard-refresh with Cmd+Shift+R to clear cache).

Check DevTools → Console: no errors.
Check DevTools → Network: no 404s, all five `js/*.js` files load with 200.

Smoke test:
- Everyday Life: tap, prompt appears, regen works, filter opens
- Strange Scenes: tap, prompt appears
- Surreal Cauldron: tap → config → generate → lock a word → back → generate again (locked word preserved)

- [ ] **Step 3: Delete the old root-level `app.js`**

```bash
rm app.js
```

Refresh browser again — confirm still works (no regression from removing the old file).

- [ ] **Step 4: Commit**

```bash
git add index.html app.js
git commit -m "refactor: switch index.html to js/ files, delete root app.js"
```
