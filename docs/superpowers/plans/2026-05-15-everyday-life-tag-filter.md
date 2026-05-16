# Everyday Life Tag Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to filter Everyday Life prompts by subject tags using a bottom-sheet filter UI with any/all mode, matching the Cauldron's tag UX.

**Architecture:** All changes are in `index.html` (single-file app) plus a one-time data cleanup on `data/just_draw_tagged.json`. A bottom sheet overlaid on `screen-just-draw` exposes tag chips and an any/all toggle. Filter state (`justDrawActiveTags`, `justDrawTagMode`) resets on every Home → Everyday Life entry. The existing `filterByTags()` function is reused unchanged.

**Tech Stack:** Vanilla JS, HTML/CSS, Caveat font, no build step. Manual browser testing via `open index.html`.

---

## Files

- **Modify:** `data/just_draw_tagged.json` — strip `holiday` and `seasonal` from all tag arrays (one-time cleanup)
- **Modify:** `index.html` — all JS, HTML, and CSS changes

---

## Task 1: Strip holiday/seasonal tags from just_draw_tagged.json

**Files:**
- Modify: `data/just_draw_tagged.json`

- [ ] **Step 1: Run the cleanup script**

```bash
python3 - <<'EOF'
import json

with open('data/just_draw_tagged.json') as f:
    data = json.load(f)

REMOVE = {'holiday', 'seasonal'}
for item in data:
    item['tags'] = [t for t in item['tags'] if t not in REMOVE]

with open('data/just_draw_tagged.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

removed = sum(1 for item in data for _ in [t for t in item.get('tags', []) if t in REMOVE])
print(f"Done. {len(data)} prompts written.")
EOF
```

Expected output: `Done. 436 prompts written.`

- [ ] **Step 2: Verify no holiday/seasonal tags remain**

```bash
python3 -c "
import json
data = json.load(open('data/just_draw_tagged.json'))
bad = [i['name'] for i in data if any(t in {'holiday','seasonal'} for t in i.get('tags',[]))]
print('Remaining:', bad if bad else 'none — clean')
"
```

Expected: `Remaining: none — clean`

- [ ] **Step 3: Commit**

```bash
git add data/just_draw_tagged.json
git commit -m "data: strip holiday and seasonal tags from just_draw_tagged.json"
```

---

## Task 2: Switch data source to just_draw_tagged.json

**Files:**
- Modify: `index.html` — `init()` function (~line 2152) and `animateJustDraw()` (~line 1446)

The tagged file has shape `{ name: string, tags: string[] }[]`. `store.justDraw` will now hold the full tagged objects. Add `store.justDrawNames` (string[]) for the animation flicker (which needs a flat name array).

- [ ] **Step 1: Update the fetch in `init()`**

Find (around line 2152):
```js
fetch('data/just_draw.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
```

Replace with:
```js
fetch('data/just_draw_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
```

- [ ] **Step 2: Add `store.justDrawNames` after `store.justDraw` assignment**

Find (around line 2165):
```js
store.justDraw            = justDraw;
```

Replace with:
```js
store.justDraw            = justDraw;
store.justDrawNames       = justDraw.map(i => i.name);
```

- [ ] **Step 3: Update `animateJustDraw` to use the names array**

Find (around line 1446):
```js
function animateJustDraw(el, finalValue) {
  animateSlot(el, store.justDraw, finalValue, 1200);
}
```

Replace with:
```js
function animateJustDraw(el, finalValue) {
  animateSlot(el, store.justDrawNames, finalValue, 1200);
}
```

- [ ] **Step 4: Verify the app still works**

Open `index.html` in a browser. Tap "Everyday Life". A prompt should appear and animate correctly. Open browser console — no errors.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: switch Everyday Life to just_draw_tagged.json"
```

---

## Task 3: Add filter state and update generateJustDraw

**Files:**
- Modify: `index.html` — state variables (~line 1853), `generateJustDraw()` (~line 1261), Home button handler (~line 1942)

- [ ] **Step 1: Add filter state variables alongside `justDrawDeck`**

Find (around line 1853):
```js
let justDrawDeck = [];     // shuffle deck for Everyday Life — reset on entry from Home
```

Replace with:
```js
let justDrawDeck = [];          // shuffle deck for Everyday Life — reset on entry from Home
let justDrawActiveTags = [];    // tag filter; empty = all prompts
let justDrawTagMode = 'any';    // 'any' | 'all'
```

- [ ] **Step 2: Update `generateJustDraw()` to filter by active tags**

Find (around line 1261):
```js
function generateJustDraw() {
  return drawFromDeck(justDrawDeck, store.justDraw);
}
```

Replace with:
```js
function generateJustDraw() {
  const pool = justDrawActiveTags.length === 0
    ? store.justDraw
    : filterByTags(store.justDraw, justDrawActiveTags, justDrawTagMode);
  const item = drawFromDeck(justDrawDeck, pool.length > 0 ? pool : store.justDraw);
  return item ? item.name : '';
}
```

- [ ] **Step 3: Reset filter state on entry from Home**

Find (around line 1942):
```js
document.getElementById('btn-just-draw').addEventListener('click', () => {
  clearHistory();
  justDrawDeck = [];
```

Replace with:
```js
document.getElementById('btn-just-draw').addEventListener('click', () => {
  clearHistory();
  justDrawDeck = [];
  justDrawActiveTags = [];
  justDrawTagMode = 'any';
```

- [ ] **Step 4: Verify filtering works in console**

Open browser console on `index.html`. Tap "Everyday Life". Then paste and run:
```js
justDrawActiveTags = ['urban'];
justDrawDeck = [];
console.log(generateJustDraw()); // should return an urban-tagged prompt name
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add filter state and update generateJustDraw for tag filtering"
```

---

## Task 4: Add HTML — filter button, tag indicator, filter sheet

**Files:**
- Modify: `index.html` — `screen-just-draw` HTML block (~line 1165)

- [ ] **Step 1: Add filter button to back-row and tag indicator + filter sheet**

Find (around line 1165):
```html
  <div id="screen-just-draw" class="screen">
    <div class="back-row">
      <button class="back-btn" data-target="screen-home">←</button>
      <span class="screen-label">Everyday Life</span>
    </div>
    <button class="copy-btn" id="copy-just-draw" title="Copy prompt">⧉</button>
    <p id="just-draw-prompt" class="prompt-text"></p>
    <button id="btn-regen-just-draw" class="regen-btn">↺ new prompt</button>
    <div class="history-nav" id="history-nav-just-draw">
      <button class="hist-arrow" id="hist-prev-just-draw">‹</button>
      <div class="hist-dots" id="hist-dots-just-draw"></div>
      <button class="hist-arrow" id="hist-next-just-draw">›</button>
    </div>
    <p class="just-draw-attribution">Prompt list by <a href="https://dannygregorysblog.com/community/edm-challenges/" target="_blank" rel="noopener">Danny Gregory</a></p>
  </div>
```

Replace with:
```html
  <div id="screen-just-draw" class="screen">
    <div class="back-row">
      <button class="back-btn" data-target="screen-home">←</button>
      <span class="screen-label">Everyday Life</span>
      <button id="jd-filter-btn" class="jd-filter-btn">⊞ filter</button>
    </div>
    <button class="copy-btn" id="copy-just-draw" title="Copy prompt">⧉</button>
    <p id="just-draw-prompt" class="prompt-text"></p>
    <p id="jd-tag-indicator" class="jd-tag-indicator"></p>
    <button id="btn-regen-just-draw" class="regen-btn">↺ new prompt</button>
    <div class="history-nav" id="history-nav-just-draw">
      <button class="hist-arrow" id="hist-prev-just-draw">‹</button>
      <div class="hist-dots" id="hist-dots-just-draw"></div>
      <button class="hist-arrow" id="hist-next-just-draw">›</button>
    </div>
    <p class="just-draw-attribution">Prompt list by <a href="https://dannygregorysblog.com/community/edm-challenges/" target="_blank" rel="noopener">Danny Gregory</a></p>

    <!-- Filter sheet overlay -->
    <div id="jd-filter-backdrop" class="jd-filter-backdrop hidden"></div>
    <div id="jd-filter-sheet" class="jd-filter-sheet hidden">
      <div class="jd-sheet-title">Filter by subject</div>
      <p class="jd-sheet-subtitle">All prompts shown when nothing selected</p>
      <div id="jd-tag-chips" class="jd-tag-chips"></div>
      <div id="jd-any-all-row" class="jd-any-all-row hidden">
        <span class="jd-any-all-label">match</span>
        <div class="jd-any-all-toggle">
          <button class="jd-aa-btn active" data-mode="any">any</button>
          <button class="jd-aa-btn" data-mode="all">all</button>
        </div>
        <span id="jd-pool-count" class="jd-pool-count"></span>
      </div>
      <div class="jd-sheet-actions">
        <button id="jd-clear-btn" class="jd-clear-btn">clear</button>
        <button id="jd-apply-btn" class="jd-apply-btn">↺ new prompt</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Verify HTML is valid**

Open `index.html` in browser. Screen should look identical to before (new elements are hidden). No console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add filter button, tag indicator, and filter sheet HTML"
```

---

## Task 5: Add CSS for all new filter elements

**Files:**
- Modify: `index.html` — `<style>` block. Insert after the `#screen-just-draw .prompt-text` rule (~line 356).

- [ ] **Step 1: Insert CSS after the `just-draw-attribution` rule block (~line 376)**

Find:
```css
.just-draw-attribution a {
  color: rgba(184, 92, 56, 0.65);
  text-decoration: underline;
```

Insert the following block immediately before that rule (after the closing `}` of `.just-draw-attribution`):

```css
    /* ── Everyday Life filter ── */
    .jd-filter-btn {
      font-family: 'Caveat', cursive;
      font-size: 1rem;
      border: 1.5px solid #b85c38;
      border-radius: 6px;
      color: #b85c38;
      background: transparent;
      padding: 1px 8px;
      cursor: pointer;
      line-height: 1.5;
      transition: background 0.1s, color 0.1s;
    }
    .jd-filter-btn.active {
      background: #b85c38;
      color: #fdf8f0;
    }

    .jd-tag-indicator {
      position: absolute;
      bottom: 10.8rem;
      left: 0;
      right: 0;
      text-align: center;
      font-family: sans-serif;
      font-size: 0.7rem;
      color: #b85c38;
      opacity: 0.72;
      pointer-events: none;
      min-height: 1.1rem;
    }

    /* ── Filter sheet ── */
    .jd-filter-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(44, 44, 44, 0.3);
      z-index: 20;
    }

    .jd-filter-sheet {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #fdf8f0;
      border-radius: 20px 20px 0 0;
      padding: 1.2rem 1.4rem 2rem;
      z-index: 21;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
    }

    .jd-sheet-title {
      font-family: 'Caveat', cursive;
      font-size: 1.6rem;
      font-weight: 700;
      color: #2c2c2c;
      margin-bottom: 0.15rem;
    }

    .jd-sheet-subtitle {
      font-family: sans-serif;
      font-size: 0.7rem;
      color: #aaa;
      margin-bottom: 0.85rem;
    }

    .jd-tag-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-bottom: 0.8rem;
    }

    .jd-chip {
      font-family: 'Caveat', cursive;
      font-size: 1.2rem;
      border: 1.5px solid #b85c38;
      border-radius: 20px;
      padding: 0.05rem 0.75rem;
      background: #fdf8f0;
      color: #b85c38;
      cursor: pointer;
      transition: background 0.1s, color 0.1s;
    }

    .jd-chip.on {
      background: #b85c38;
      color: #fdf8f0;
    }

    .jd-any-all-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.8rem;
    }

    .jd-any-all-label {
      font-family: sans-serif;
      font-size: 0.72rem;
      color: #888;
    }

    .jd-any-all-toggle {
      display: flex;
      border: 1.5px solid #b85c38;
      border-radius: 8px;
      overflow: hidden;
    }

    .jd-aa-btn {
      font-family: sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 9px;
      background: none;
      border: none;
      color: #b85c38;
      cursor: pointer;
    }

    .jd-aa-btn + .jd-aa-btn {
      border-left: 1.5px solid #b85c38;
    }

    .jd-aa-btn.active {
      background: #b85c38;
      color: #fdf8f0;
    }

    .jd-pool-count {
      font-family: sans-serif;
      font-size: 0.7rem;
      color: #b85c38;
      opacity: 0.65;
      margin-left: auto;
    }

    .jd-sheet-actions {
      display: flex;
      gap: 0.6rem;
    }

    .jd-clear-btn {
      font-family: 'Caveat', cursive;
      font-size: 1.3rem;
      background: none;
      border: 1.5px solid #ccc;
      border-radius: 10px;
      color: #aaa;
      padding: 0.3rem 1rem;
      cursor: pointer;
      flex: 1;
    }

    .jd-apply-btn {
      font-family: 'Caveat', cursive;
      font-size: 1.3rem;
      background: #b85c38;
      border: 1.5px solid #b85c38;
      border-radius: 10px;
      color: #fdf8f0;
      padding: 0.3rem 1.4rem;
      cursor: pointer;
      flex: 2;
      box-shadow: 2px 2px 0 #7a3a1e;
    }

    .jd-apply-btn:disabled {
      opacity: 0.35;
      cursor: default;
      box-shadow: none;
    }

    .jd-empty-warning {
      font-family: sans-serif;
      font-size: 0.68rem;
      color: #b85c38;
      opacity: 0.75;
      text-align: center;
      margin-bottom: 0.5rem;
    }
```

- [ ] **Step 2: Adjust `#screen-just-draw .history-nav` bottom to make room for tag indicator**

Find:
```css
#screen-just-draw .history-nav {
  bottom: 7.2rem;
}
```

Replace with:
```css
#screen-just-draw .history-nav {
  bottom: 7.2rem;
}

#screen-just-draw .prompt-text {
  max-height: calc(100vh - 17rem);
}
```

(This overrides the existing `max-height` rule at ~line 356 to account for the extra tag indicator height.)

- [ ] **Step 3: Verify layout in browser**

Open `index.html`, tap "Everyday Life". The prompt screen should look identical to before. Tap "⊞ filter" — nothing happens yet (JS not wired). No visual regressions.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add CSS for Everyday Life filter sheet and tag indicator"
```

---

## Task 6: Wire filter sheet interactions

**Files:**
- Modify: `index.html` — JS section. Insert a new `// ── Everyday Life filter ──` block before the `// ── Event wiring ──` comment (~line 1941).

- [ ] **Step 1: Insert the filter sheet JS block**

Find (around line 1941):
```js
    // ── Event wiring ─────────────────────────────────────────────
```

Insert immediately before it:

```js
    // ── Everyday Life filter ──────────────────────────────────────
    const JD_TAGS = [
      'still_life', 'organic', 'sensory', 'emotional',
      'spatial', 'temporal', 'urban', 'craft',
      'nature', 'figures', 'imagination'
    ];

    // Scratch state — represents what's in the open sheet (not yet applied)
    let jdSheetTags = [];
    let jdSheetMode = 'any';

    function jdPoolCount(tags, mode) {
      if (tags.length === 0) return store.justDraw.length;
      return filterByTags(store.justDraw, tags, mode).length;
    }

    function renderJdSheet() {
      const chipsEl = document.getElementById('jd-tag-chips');
      const anyAllRow = document.getElementById('jd-any-all-row');
      const poolCountEl = document.getElementById('jd-pool-count');
      const applyBtn = document.getElementById('jd-apply-btn');
      const aaBtns = document.querySelectorAll('.jd-aa-btn');

      // Rebuild chips
      chipsEl.innerHTML = '';
      JD_TAGS.forEach(tag => {
        const chip = document.createElement('button');
        chip.className = 'jd-chip' + (jdSheetTags.includes(tag) ? ' on' : '');
        chip.textContent = tag.replace('_', ' ');
        chip.addEventListener('click', () => {
          if (jdSheetTags.includes(tag)) {
            jdSheetTags = jdSheetTags.filter(t => t !== tag);
            if (jdSheetTags.length === 0) jdSheetMode = 'any';
          } else {
            jdSheetTags = [...jdSheetTags, tag];
          }
          renderJdSheet();
        });
        chipsEl.appendChild(chip);
      });

      // Any/all row visibility
      anyAllRow.classList.toggle('hidden', jdSheetTags.length === 0);

      // Any/all button active state
      aaBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === jdSheetMode);
      });

      // Pool count and apply button
      const count = jdPoolCount(jdSheetTags, jdSheetMode);
      poolCountEl.textContent = jdSheetTags.length > 0 ? `${count} prompts` : '';

      // Empty pool warning
      let warning = chipsEl.parentElement.querySelector('.jd-empty-warning');
      if (count === 0 && jdSheetTags.length > 0) {
        if (!warning) {
          warning = document.createElement('p');
          warning.className = 'jd-empty-warning';
          warning.textContent = "no prompts match — try 'any' or fewer tags";
          document.getElementById('jd-any-all-row').after(warning);
        }
      } else if (warning) {
        warning.remove();
      }

      applyBtn.disabled = count === 0;
    }

    function openJdFilterSheet() {
      // Snapshot current active state into sheet scratch state
      jdSheetTags = [...justDrawActiveTags];
      jdSheetMode = justDrawTagMode;
      document.getElementById('jd-filter-backdrop').classList.remove('hidden');
      document.getElementById('jd-filter-sheet').classList.remove('hidden');
      document.getElementById('jd-filter-btn').classList.add('active');
      renderJdSheet();
    }

    function closeJdFilterSheet() {
      document.getElementById('jd-filter-backdrop').classList.add('hidden');
      document.getElementById('jd-filter-sheet').classList.add('hidden');
    }

    function applyJdFilter() {
      justDrawActiveTags = [...jdSheetTags];
      justDrawTagMode = jdSheetMode;
      justDrawDeck = [];
      closeJdFilterSheet();
      updateJdFilterBtn();
      updateJdTagIndicator();
    }

    function updateJdFilterBtn() {
      document.getElementById('jd-filter-btn')
        .classList.toggle('active', justDrawActiveTags.length > 0);
    }

    function updateJdTagIndicator() {
      const el = document.getElementById('jd-tag-indicator');
      if (justDrawActiveTags.length === 0) {
        el.textContent = '';
      } else {
        const labels = justDrawActiveTags.map(t => t.replace('_', ' ')).join(', ');
        el.textContent = `${justDrawTagMode}: ${labels}`;
      }
    }

    // Filter button
    document.getElementById('jd-filter-btn').addEventListener('click', openJdFilterSheet);

    // Backdrop closes sheet without applying
    document.getElementById('jd-filter-backdrop').addEventListener('click', () => {
      closeJdFilterSheet();
      updateJdFilterBtn();
    });

    // Any/all toggle buttons
    document.querySelectorAll('.jd-aa-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        jdSheetMode = btn.dataset.mode;
        renderJdSheet();
      });
    });

    // Clear button
    document.getElementById('jd-clear-btn').addEventListener('click', () => {
      jdSheetTags = [];
      jdSheetMode = 'any';
      renderJdSheet();
    });

    // Apply button
    document.getElementById('jd-apply-btn').addEventListener('click', () => {
      applyJdFilter();
      const finalValue = generateJustDraw();
      const el = document.getElementById('just-draw-prompt');
      el.textContent = finalValue;
      animateJustDraw(el, finalValue);
      pushToHistory(finalValue);
      renderHistoryWidget('history-nav-just-draw', 'hist-dots-just-draw', 'hist-prev-just-draw', 'hist-next-just-draw');
    });

```

- [ ] **Step 2: Reset indicator and filter button on Home entry**

Find (around line 1942, after the new block you just inserted):
```js
    document.getElementById('btn-just-draw').addEventListener('click', () => {
      clearHistory();
      justDrawDeck = [];
      justDrawActiveTags = [];
      justDrawTagMode = 'any';
```

Replace with:
```js
    document.getElementById('btn-just-draw').addEventListener('click', () => {
      clearHistory();
      justDrawDeck = [];
      justDrawActiveTags = [];
      justDrawTagMode = 'any';
      updateJdFilterBtn();
      updateJdTagIndicator();
```

- [ ] **Step 3: Verify in browser**

Open `index.html`, tap "Everyday Life".
1. Tap `⊞ filter` — sheet slides up with 11 tag chips.
2. Tap `sensory` and `urban` chips — they highlight, pool count appears (`121 prompts`), any/all toggle appears.
3. Tap `all` — pool count drops (should be single digits).
4. Tap `↺ new prompt` — sheet closes, prompt updates, tag indicator shows `all: sensory, urban`, filter button is highlighted.
5. Tap `⊞ filter` again — sheet reopens with `sensory` + `urban` still selected.
6. Tap backdrop — sheet closes, no change to active filter.
7. Go back to Home, re-enter Everyday Life — filter button not highlighted, indicator empty.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: wire Everyday Life filter sheet interactions"
```

---

## Task 7: Final verification and edge cases

**Files:**
- Modify: `index.html` if any issues found

- [ ] **Step 1: Test layout stability**

Open `index.html`, tap "Everyday Life". Apply a filter (e.g. `urban`). Regen several times. Confirm the tag indicator, history nav, and regen button do not shift position between regens.

- [ ] **Step 2: Test empty pool edge case**

Open filter sheet. Select `craft` + `urban` + `all` — the pool should be 0 or very few. If 0: confirm `↺ new prompt` is disabled and the warning message appears.

- [ ] **Step 3: Test deck exhaustion / no-repeat**

Apply a very narrow filter (e.g. `craft` + `figures` with `all`). Regen repeatedly until the deck resets — confirm the prompt cycles without immediate repeats and resets cleanly.

- [ ] **Step 4: Test `clear` button**

Open filter sheet with active tags, tap `clear` — all chips deselect, any/all row hides, pool count disappears. Then tap `↺ new prompt` — sheet closes, filter button unhighlights, tag indicator clears.

- [ ] **Step 5: Commit if any fixes were needed**

```bash
git add index.html
git commit -m "fix: Everyday Life filter edge cases"
```
