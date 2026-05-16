# Strange Scenes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Strange Scenes" mode — a random full-prompt picker from 50 Topor-inspired prompts with tag filtering — built on shared pool-mode abstractions that also power the refactored Everyday Life mode.

**Architecture:** All JS/HTML/CSS changes in `index.html`. New `data/strange_scenes.json` holds the prompt data. Everyday Life's bespoke `jd-*` CSS classes are renamed to shared `pm-*` classes, and its bespoke `renderJdSheet/openJdFilterSheet/…` functions are replaced by parameterized shared functions (`renderFilterSheet`, `openFilterSheet`, `closeFilterSheet`, `applyFilter`, `updateFilterBtn`, `updateTagIndicator`, `generateFromPool`, `regenPoolMode`) driven by a mode config object. Strange Scenes uses the same shared functions with its own config. `screen-strange-scenes` mirrors `screen-just-draw` in structure.

**Tech Stack:** Vanilla JS, HTML, CSS — no frameworks, no dependencies. Served via `python3 -m http.server 8080` or `open index.html`.

**Branch:** `claude/condescending-carson-4e38e9` — do NOT touch `main`.

---

## File Structure

| File | Action | What changes |
|---|---|---|
| `data/strange_scenes.json` | Create | 50 tagged Topor full prompts |
| `index.html` | Modify | CSS class rename, refactored JS, new HTML screen, new event wiring |

---

## Task 1: Create data/strange_scenes.json

**Files:**
- Create: `data/strange_scenes.json`

- [ ] **Step 1: Write the file**

```bash
cat > data/strange_scenes.json << 'EOF'
[
  { "text": "A man using his own ribs as the rungs of a ladder.", "tags": ["body"] },
  { "text": "A dinner plate where the food is screaming back at the diner.", "tags": ["domestic", "objects"] },
  { "text": "A woman unzipping her skin to reveal a second, identical woman.", "tags": ["body"] },
  { "text": "A cityscape where the buildings are made of giant, stacked teeth.", "tags": ["architecture", "body"] },
  { "text": "A businessman's necktie that turns into a constrictor snake.", "tags": ["objects"] },
  { "text": "A pair of eyes floating in a bowl of soup like meatballs.", "tags": ["body", "domestic"] },
  { "text": "A telephone handset that is a human ear on both ends.", "tags": ["body", "objects"] },
  { "text": "A tree where the leaves are tiny, reaching hands.", "tags": ["nature", "body"] },
  { "text": "A man trying to shave, but his reflection is refusing to move.", "tags": ["shadow", "domestic"] },
  { "text": "A bird's nest made entirely of human hair and jewelry.", "tags": ["nature", "body"] },
  { "text": "A suitcase that, when opened, contains a miniature, crowded theater.", "tags": ["objects"] },
  { "text": "A teapot pouring out thick, black shadows instead of tea.", "tags": ["objects", "shadow", "domestic"] },
  { "text": "A hand with a mouth in the palm, biting its own fingers.", "tags": ["body"] },
  { "text": "A person's shadow detaching itself to walk in the opposite direction.", "tags": ["shadow"] },
  { "text": "A bouquet of flowers where the centers are staring eyeballs.", "tags": ["nature", "body"] },
  { "text": "A man sewing his own shadow back onto his heels.", "tags": ["shadow", "body"] },
  { "text": "A clock where the hands are long, pointed fingers.", "tags": ["objects", "body"] },
  { "text": "A face where the nose has been replaced by a smaller, screaming face.", "tags": ["body"] },
  { "text": "A bathtub overflowing with letters that have never been read.", "tags": ["domestic", "objects"] },
  { "text": "A person wearing a mask that is more realistic than their actual face.", "tags": ["body", "objects"] },
  { "text": "A chair that has human legs and is trying to walk away.", "tags": ["objects", "body"] },
  { "text": "A typewriter where the keys are individual human teeth.", "tags": ["objects", "body"] },
  { "text": "A man looking into a mirror and seeing his internal organs.", "tags": ["shadow", "body"] },
  { "text": "A staircase that leads into a giant, open mouth.", "tags": ["architecture", "body"] },
  { "text": "A sky where the clouds are shaped like various internal organs.", "tags": ["nature", "body"] },
  { "text": "A pair of scissors cutting through the fabric of the sky.", "tags": ["objects", "nature"] },
  { "text": "A person whose umbrella is raining on them from the inside.", "tags": ["objects"] },
  { "text": "A loaf of bread that contains a hidden, sleeping infant.", "tags": ["domestic", "body"] },
  { "text": "A man's brain being sliced like a block of cheese.", "tags": ["body", "domestic"] },
  { "text": "A dollhouse where the dolls are performing a complex surgery.", "tags": ["objects", "body", "domestic"] },
  { "text": "A person's footprints filling up with dark, murky water.", "tags": ["shadow"] },
  { "text": "A lightbulb that emits darkness, turning the room pitch black.", "tags": ["objects", "shadow"] },
  { "text": "A woman's dress made entirely of living butterflies.", "tags": ["nature", "objects"] },
  { "text": "A man's beard that has become a tangled web of spiders.", "tags": ["body", "nature"] },
  { "text": "A window that looks out onto a different century.", "tags": ["architecture"] },
  { "text": "A person whose reflection is several seconds behind their movements.", "tags": ["shadow"] },
  { "text": "A musical instrument that produces visible, solid shapes instead of sound.", "tags": ["objects"] },
  { "text": "A dinner party where all the guests are wearing paper bags over their heads.", "tags": ["domestic"] },
  { "text": "A man's shadow being stepped on, causing him physical pain.", "tags": ["shadow"] },
  { "text": "A bed that is actually a giant, open book.", "tags": ["objects", "domestic"] },
  { "text": "A person's thoughts escaping their head as colorful, toxic smoke.", "tags": ["body"] },
  { "text": "A mirror that shows the viewer as they will look in fifty years.", "tags": ["shadow"] },
  { "text": "A bird with human arms instead of wings.", "tags": ["nature", "body"] },
  { "text": "A person whose skin is covered in delicate, intricate maps.", "tags": ["body"] },
  { "text": "A fountain that is flowing with black ink.", "tags": ["architecture", "objects"] },
  { "text": "A man trying to catch his own head as it rolls away.", "tags": ["body"] },
  { "text": "A house where the doors and windows are constantly shifting positions.", "tags": ["architecture"] },
  { "text": "A person whose veins are visible and arranged like a city map.", "tags": ["body", "architecture"] },
  { "text": "A giant eye watching a small, oblivious crowd from the horizon.", "tags": ["body", "nature"] },
  { "text": "A man melting into a puddle, leaving only his hat and glasses behind.", "tags": ["body"] }
]
EOF
```

- [ ] **Step 2: Verify**

```bash
python3 -c "
import json
data = json.load(open('data/strange_scenes.json'))
print(f'{len(data)} prompts loaded')
tags = sorted({t for item in data for t in item['tags']})
print('Tags:', tags)
assert len(data) == 50
assert tags == ['architecture', 'body', 'domestic', 'nature', 'objects', 'shadow']
print('OK')
"
```

Expected:
```
50 prompts loaded
Tags: ['architecture', 'body', 'domestic', 'nature', 'objects', 'shadow']
OK
```

- [ ] **Step 3: Commit**

```bash
git add data/strange_scenes.json
git commit -m "data: add strange_scenes.json with 50 tagged Topor prompts"
```

---

## Task 2: Rename jd-* CSS classes to pm-* in index.html

**Files:**
- Modify: `index.html`

Renames CSS class names (not element IDs) from the `jd-` prefix to shared `pm-` prefix. Element IDs (`id="jd-filter-btn"` etc.) and `getElementById` calls are unchanged — only class selectors and class attribute values change.

- [ ] **Step 1: Run the rename script**

```bash
python3 - << 'EOF'
import re

with open('index.html', 'r') as f:
    content = f.read()

CLASS_RENAMES = [
    'jd-filter-btn', 'jd-filter-backdrop', 'jd-filter-sheet',
    'jd-tag-chips', 'jd-chip', 'jd-any-all-row', 'jd-any-all-label',
    'jd-any-all-toggle', 'jd-aa-btn', 'jd-pool-count',
    'jd-sheet-actions', 'jd-clear-btn', 'jd-apply-btn',
    'jd-empty-warning', 'jd-tag-indicator', 'jd-header-right',
    'jd-sheet-title', 'jd-sheet-subtitle', 'jd-tag-chips',
]

for old in CLASS_RENAMES:
    new = old.replace('jd-', 'pm-', 1)
    # 1. CSS selectors: .jd-xxx { and .jd-xxx + and .jd-xxx. etc.
    content = content.replace(f'.{old}', f'.{new}')
    # 2. HTML class= attribute values (handles multi-class and single-class)
    content = re.sub(
        r'(?<=class=")([^"]*)\b' + re.escape(old) + r'\b',
        lambda m, n=new, o=old: m.group(1) + n,
        content
    )
    # 3. JS bare class name strings: className = 'jd-xxx' patterns
    content = content.replace(f"'{old}'", f"'{new}'")
    content = content.replace(f'"{old}"', f'"{new}"')

with open('index.html', 'w') as f:
    f.write(content)

print('Done')
EOF
```

Expected: `Done`

- [ ] **Step 2: Verify no jd-* class references remain (IDs are fine)**

```bash
python3 - << 'EOF'
import re

content = open('index.html').read()

# CSS selectors with dot prefix
css_hits = re.findall(r'\.jd-\w+', content)
# HTML class attribute values
class_hits = re.findall(r'class="[^"]*jd-\w+[^"]*"', content)
# JS className strings
js_hits = re.findall(r"""['"]jd-\w+['"]""", content)

print('CSS selector hits (should be 0):', css_hits)
print('class= attr hits (should be 0):', class_hits)
print('JS string hits (should be 0):', js_hits)

# IDs are fine — just confirm they still exist
id_hits = re.findall(r'id="jd-\w+"', content)
print(f'ID references still present: {len(id_hits)} (expected ~10+)')
EOF
```

Expected: all three "should be 0" lists are empty; IDs count is non-zero.

- [ ] **Step 3: Open in browser and verify Everyday Life still works**

```bash
python3 -m http.server 8080 &
open http://localhost:8080
```

Tap "Everyday Life". Tap "⊞ filter". Confirm filter sheet opens with chips. Select a tag, tap "↺ new prompt". Confirm prompt changes and tag indicator appears. Kill server: `kill %1`

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: rename jd-* CSS classes to shared pm-* prefix"
```

---

## Task 3: Refactor Everyday Life to shared pool-mode architecture

**Files:**
- Modify: `index.html`

Replaces the bespoke `renderJdSheet / openJdFilterSheet / closeJdFilterSheet / applyJdFilter / updateJdFilterBtn / updateJdTagIndicator / generateJustDraw` functions and their associated state variables (`justDrawDeck`, `justDrawActiveTags`, `justDrawTagMode`, `jdSheetTags`, `jdSheetMode`) with a `jdConfig` object and eight shared parameterized functions. Also adds `ssConfig` skeleton. All Everyday Life event listeners are updated to call the shared functions.

- [ ] **Step 1: Replace the state variable declarations**

Find these 5 lines (around line 2091):
```js
    let justDrawDeck = [];          // shuffle deck for Everyday Life — reset on entry from Home
    let justDrawActiveTags = [];    // tag filter; empty = all prompts
    let justDrawTagMode = 'any';    // 'any' | 'all'
```
And these 2 lines in the `// ── Everyday Life filter ──` section:
```js
    let jdSheetTags = [];
    let jdSheetMode = 'any';
```

Replace all five with the two config objects (find the state vars block and replace):

```js
    // ── Pool-mode configs ─────────────────────────────────────────
    const JD_TAGS = [
      'still_life', 'organic', 'sensory', 'emotional',
      'spatial', 'temporal', 'urban', 'craft',
      'nature', 'figures', 'imagination'
    ];
    const SS_TAGS = ['body', 'objects', 'shadow', 'domestic', 'nature', 'architecture'];

    const jdConfig = {
      getPool:   () => store.justDraw,
      getNames:  () => store.justDrawNames,
      textField: 'name',
      tags:      JD_TAGS,
      sheetTitle: 'Filter by subject',
      deck:       [],
      activeTags: [],
      tagMode:    'any',
      sheetTags:  [],
      sheetMode:  'any',
      ids: {
        promptEl:       'just-draw-prompt',
        tagIndicator:   'jd-tag-indicator',
        filterBtn:      'jd-filter-btn',
        filterBackdrop: 'jd-filter-backdrop',
        filterSheet:    'jd-filter-sheet',
        tagChips:       'jd-tag-chips',
        anyAllRow:      'jd-any-all-row',
        poolCount:      'jd-pool-count',
        clearBtn:       'jd-clear-btn',
        applyBtn:       'jd-apply-btn',
        histNav:        'history-nav-just-draw',
        histDots:       'hist-dots-just-draw',
        histPrev:       'hist-prev-just-draw',
        histNext:       'hist-next-just-draw',
        copyBtn:        'copy-just-draw',
      }
    };

    const ssConfig = {
      getPool:   () => store.strangeScenes,
      getNames:  () => store.strangeSceneTexts,
      textField: 'text',
      tags:      SS_TAGS,
      sheetTitle: 'Filter by theme',
      deck:       [],
      activeTags: [],
      tagMode:    'any',
      sheetTags:  [],
      sheetMode:  'any',
      ids: {
        promptEl:       'ss-prompt',
        tagIndicator:   'ss-tag-indicator',
        filterBtn:      'ss-filter-btn',
        filterBackdrop: 'ss-filter-backdrop',
        filterSheet:    'ss-filter-sheet',
        tagChips:       'ss-tag-chips',
        anyAllRow:      'ss-any-all-row',
        poolCount:      'ss-pool-count',
        clearBtn:       'ss-clear-btn',
        applyBtn:       'ss-apply-btn',
        histNav:        'history-nav-strange-scenes',
        histDots:       'hist-dots-strange-scenes',
        histPrev:       'hist-prev-strange-scenes',
        histNext:       'hist-next-strange-scenes',
        copyBtn:        'copy-strange-scenes',
      }
    };
```

- [ ] **Step 2: Replace the entire `// ── Everyday Life filter ──` section**

Find the block starting with `// ── Everyday Life filter ──` and ending just before `// Filter button` event listener wiring (approximately lines 2181–2248). Replace the `jdPoolCount` and `renderJdSheet` functions with the shared functions:

```js
    // ── Shared pool-mode functions ────────────────────────────────

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
      const el = document.getElementById(cfg.ids.promptEl);
      el.textContent = finalValue;
      animateSlot(el, cfg.getNames(), finalValue, 1200);
      pushToHistory(finalValue);
      renderHistoryWidget(cfg.ids.histNav, cfg.ids.histDots, cfg.ids.histPrev, cfg.ids.histNext);
    }

    function renderFilterSheet(cfg) {
      const ids = cfg.ids;
      const chipsEl      = document.getElementById(ids.tagChips);
      const anyAllRow    = document.getElementById(ids.anyAllRow);
      const poolCountEl  = document.getElementById(ids.poolCount);
      const applyBtn     = document.getElementById(ids.applyBtn);
      const aaBtns       = anyAllRow.querySelectorAll('.pm-aa-btn');

      chipsEl.innerHTML = '';
      cfg.tags.forEach(tag => {
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
          document.getElementById(ids.anyAllRow).after(warning);
        }
      } else if (warning) {
        warning.remove();
      }

      applyBtn.disabled = count === 0;
    }

    function openFilterSheet(cfg) {
      cfg.sheetTags = [...cfg.activeTags];
      cfg.sheetMode = cfg.tagMode;
      document.getElementById(cfg.ids.filterBackdrop).classList.add('visible');
      document.getElementById(cfg.ids.filterSheet).classList.remove('hidden');
      document.getElementById(cfg.ids.filterBtn).classList.add('active');
      renderFilterSheet(cfg);
    }

    function closeFilterSheet(cfg) {
      document.getElementById(cfg.ids.filterBackdrop).classList.remove('visible');
      document.getElementById(cfg.ids.filterSheet).classList.add('hidden');
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
      document.getElementById(cfg.ids.filterBtn)
        .classList.toggle('active', cfg.activeTags.length > 0);
    }

    function updateTagIndicator(cfg) {
      const el = document.getElementById(cfg.ids.tagIndicator);
      if (cfg.activeTags.length === 0) {
        el.textContent = '';
      } else {
        const labels = cfg.activeTags.map(t => t.replace('_', ' ')).join(', ');
        el.textContent = `${cfg.tagMode}: ${labels}`;
      }
    }
```

- [ ] **Step 3: Replace the Everyday Life event listener block**

Find the block of event listeners from `// Filter button` through `// Apply button` (the ones referencing `openJdFilterSheet`, `closeJdFilterSheet`, `applyJdFilter`, `.jd-aa-btn`, `jd-clear-btn`, `jd-apply-btn`). Replace with:

```js
    // ── Everyday Life filter event wiring ────────────────────────
    document.getElementById('jd-filter-btn').addEventListener('click', () => openFilterSheet(jdConfig));
    document.getElementById('jd-filter-backdrop').addEventListener('click', () => {
      closeFilterSheet(jdConfig);
      updateFilterBtn(jdConfig);
    });
    document.getElementById('jd-clear-btn').addEventListener('click', () => {
      jdConfig.sheetTags = [];
      jdConfig.sheetMode = 'any';
      renderFilterSheet(jdConfig);
    });
    document.getElementById('jd-apply-btn').addEventListener('click', () => {
      applyFilter(jdConfig);
      regenPoolMode(jdConfig);
    });
    document.querySelectorAll('#jd-any-all-row .pm-aa-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        jdConfig.sheetMode = btn.dataset.mode;
        renderFilterSheet(jdConfig);
      });
    });
```

- [ ] **Step 4: Replace the btn-just-draw and btn-regen-just-draw event listeners**

Find the `btn-just-draw` click handler (around line 2325). Replace:

```js
    document.getElementById('btn-just-draw').addEventListener('click', () => {
      clearHistory();
      jdConfig.deck       = [];
      jdConfig.activeTags = [];
      jdConfig.tagMode    = 'any';
      updateFilterBtn(jdConfig);
      updateTagIndicator(jdConfig);
      showScreen('screen-just-draw');
      regenPoolMode(jdConfig);
    });

    document.getElementById('btn-regen-just-draw').addEventListener('click', () => {
      regenPoolMode(jdConfig);
    });
```

- [ ] **Step 5: Delete the now-unused bespoke functions**

Remove these functions entirely (they are fully replaced by the shared functions above):
- `function generateJustDraw() { ... }` (replaced by `generateFromPool(jdConfig)`)
- `function openJdFilterSheet() { ... }` (replaced by `openFilterSheet(cfg)`)
- `function closeJdFilterSheet() { ... }` (replaced by `closeFilterSheet(cfg)`)
- `function applyJdFilter() { ... }` (replaced by `applyFilter(cfg)`)
- `function updateJdFilterBtn() { ... }` (replaced by `updateFilterBtn(cfg)`)
- `function updateJdTagIndicator() { ... }` (replaced by `updateTagIndicator(cfg)`)
- `function jdPoolCount() { ... }` (inlined into `renderFilterSheet`)
- `function renderJdSheet() { ... }` (replaced by `renderFilterSheet(cfg)`)
- `function animateJustDraw() { ... }` (inlined into `regenPoolMode` via `animateSlot`)

Also remove the now-redundant `const JD_TAGS = [...]` block if it still exists separately (it's now inside `jdConfig`).

- [ ] **Step 6: Smoke-test Everyday Life**

```bash
python3 -m http.server 8080 &
open http://localhost:8080
```

- Tap "Everyday Life" → prompt appears, animation plays
- Tap "↺ new prompt" → new prompt, history dots appear
- Tap "⊞ filter" → filter sheet opens with chips
- Select a tag, tap apply → prompt regenerates, tag indicator appears
- Tap back arrow → returns to home
- Kill server: `kill %1`

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "refactor: extract shared pool-mode functions; migrate Everyday Life to jdConfig"
```

---

## Task 4: Extend init() to load strange_scenes.json

**Files:**
- Modify: `index.html` — `init()` function around line 2537

- [ ] **Step 1: Add strange_scenes.json to the Promise.all fetch**

Find:
```js
        const [justDraw, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw] =
          await Promise.all([
            fetch('data/just_draw_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
```

Replace with:
```js
        const [justDraw, strangeScenes, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw] =
          await Promise.all([
            fetch('data/just_draw_tagged.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
            fetch('data/strange_scenes.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
```

- [ ] **Step 2: Update the empty-data guard**

Find:
```js
        if ([justDraw, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw]
            .some(d => !Array.isArray(d) || d.length === 0)) {
```

Replace with:
```js
        if ([justDraw, strangeScenes, adjectives, nounsOrganicRaw, nounsSyntheticRaw, verbsRaw, environmentsRaw]
            .some(d => !Array.isArray(d) || d.length === 0)) {
```

- [ ] **Step 3: Add store assignments for strangeScenes**

After `store.justDrawNames = justDraw.map(i => i.name);`, add:
```js
        store.strangeScenes      = strangeScenes;
        store.strangeSceneTexts  = strangeScenes.map(i => i.text);
```

- [ ] **Step 4: Enable the Strange Scenes button on success, disable on error**

After `document.getElementById('btn-cauldron').disabled = false;`, add:
```js
        document.getElementById('btn-strange-scenes').disabled = false;
```

In the catch block after `document.getElementById('btn-cauldron').disabled = true;`, add:
```js
        document.getElementById('btn-strange-scenes').disabled = true;
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: load strange_scenes.json into store on init"
```

---

## Task 5: Add screen-strange-scenes HTML

**Files:**
- Modify: `index.html` — home screen buttons + new screen element

- [ ] **Step 1: Add the Strange Scenes button on the home screen**

Find:
```html
      <button id="btn-cauldron" class="mode-btn">✦ Surreal Cauldron</button>
```

Add after it:
```html
      <button id="btn-strange-scenes" class="mode-btn" disabled>Strange Scenes</button>
```

- [ ] **Step 2: Add the screen-strange-scenes HTML**

Find the closing `</div>` of `screen-just-draw` (the one that contains `jd-filter-backdrop` and `jd-filter-sheet`). Insert the new screen immediately after:

```html
  <!-- Screen: Strange Scenes -->
  <div id="screen-strange-scenes" class="screen">
    <div class="back-row">
      <button class="back-btn" data-target="screen-home">←</button>
      <span class="screen-label">Strange Scenes</span>
    </div>
    <div class="pm-header-right">
      <button id="ss-filter-btn" class="pm-filter-btn">⊞ filter</button>
      <button class="copy-btn" id="copy-strange-scenes" title="Copy prompt">⧉ copy</button>
    </div>
    <p id="ss-prompt" class="prompt-text"></p>
    <p id="ss-tag-indicator" class="pm-tag-indicator"></p>
    <button id="btn-regen-strange-scenes" class="regen-btn">↺ new prompt</button>
    <div class="history-nav" id="history-nav-strange-scenes">
      <button class="hist-arrow" id="hist-prev-strange-scenes">‹</button>
      <div class="hist-dots" id="hist-dots-strange-scenes"></div>
      <button class="hist-arrow" id="hist-next-strange-scenes">›</button>
    </div>
    <p class="just-draw-attribution">Prompts inspired by the work of Roland Topor</p>
    <div id="ss-filter-backdrop" class="pm-filter-backdrop"></div>
    <div id="ss-filter-sheet" class="pm-filter-sheet hidden">
      <div class="pm-sheet-title">Filter by theme</div>
      <p class="pm-sheet-subtitle">All prompts shown when nothing selected</p>
      <div id="ss-tag-chips" class="pm-tag-chips"></div>
      <div id="ss-any-all-row" class="pm-any-all-row hidden">
        <span class="pm-any-all-label">match</span>
        <div class="pm-any-all-toggle">
          <button class="pm-aa-btn active" data-mode="any">any</button>
          <button class="pm-aa-btn" data-mode="all">all</button>
        </div>
        <span id="ss-pool-count" class="pm-pool-count"></span>
      </div>
      <div class="pm-sheet-actions">
        <button id="ss-clear-btn" class="pm-clear-btn">clear</button>
        <button id="ss-apply-btn" class="pm-apply-btn">↺ new prompt</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: Add CSS overrides for screen-strange-scenes positioning**

Find the block:
```css
#screen-just-draw .regen-btn {
```

Add before it:
```css
#screen-strange-scenes .regen-btn { bottom: 2.2rem; }
#screen-strange-scenes .history-nav { bottom: 5rem; }
#screen-strange-scenes .prompt-text { max-height: calc(100vh - 10rem); }
```

- [ ] **Step 4: Update showScreen to dim wallpaper and preserve history for Strange Scenes**

Find:
```js
      document.getElementById('wallpaper-layer')
        .classList.toggle('dimmed', id === 'screen-imagine-prompt' || id === 'screen-just-draw');
      if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt' && id !== 'screen-cauldron-config') {
```

Replace with:
```js
      document.getElementById('wallpaper-layer')
        .classList.toggle('dimmed', id === 'screen-imagine-prompt' || id === 'screen-just-draw' || id === 'screen-strange-scenes');
      if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt' && id !== 'screen-cauldron-config' && id !== 'screen-strange-scenes') {
```

- [ ] **Step 5: Update clearHistory to hide Strange Scenes history nav**

Find:
```js
      document.getElementById('history-nav-just-draw').classList.remove('visible');
```

Add after it:
```js
      document.getElementById('history-nav-strange-scenes').classList.remove('visible');
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add screen-strange-scenes HTML, CSS overrides, showScreen updates"
```

---

## Task 6: Wire Strange Scenes event listeners

**Files:**
- Modify: `index.html` — event wiring section

- [ ] **Step 1: Add Strange Scenes event listeners**

Find the `setupCopyBtn('copy-just-draw', ...)` call. Add after the `setupCopyBtn('copy-imagine', ...)` call:

```js
    setupCopyBtn('copy-strange-scenes', () =>
      document.getElementById('ss-prompt').textContent.trim()
    );
```

Find the `hist-prev-just-draw` and `hist-next-just-draw` event listeners block. Add after:

```js
    document.getElementById('hist-prev-strange-scenes').addEventListener('click', () => {
      navigateHistory(-1, 'ss-prompt', 'sparks');
    });
    document.getElementById('hist-next-strange-scenes').addEventListener('click', () => {
      navigateHistory(1, 'ss-prompt', 'sparks');
    });
```

Add the Strange Scenes home button, back button, regen button, and filter sheet listeners. Find the `btn-just-draw` event listener block and add after it:

```js
    document.getElementById('btn-strange-scenes').addEventListener('click', () => {
      clearHistory();
      ssConfig.deck       = [];
      ssConfig.activeTags = [];
      ssConfig.tagMode    = 'any';
      updateFilterBtn(ssConfig);
      updateTagIndicator(ssConfig);
      showScreen('screen-strange-scenes');
      regenPoolMode(ssConfig);
    });

    document.getElementById('btn-regen-strange-scenes').addEventListener('click', () => {
      regenPoolMode(ssConfig);
    });

    // Strange Scenes filter sheet
    document.getElementById('ss-filter-btn').addEventListener('click', () => openFilterSheet(ssConfig));
    document.getElementById('ss-filter-backdrop').addEventListener('click', () => {
      closeFilterSheet(ssConfig);
      updateFilterBtn(ssConfig);
    });
    document.getElementById('ss-clear-btn').addEventListener('click', () => {
      ssConfig.sheetTags = [];
      ssConfig.sheetMode = 'any';
      renderFilterSheet(ssConfig);
    });
    document.getElementById('ss-apply-btn').addEventListener('click', () => {
      applyFilter(ssConfig);
      regenPoolMode(ssConfig);
    });
    document.querySelectorAll('#ss-any-all-row .pm-aa-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ssConfig.sheetMode = btn.dataset.mode;
        renderFilterSheet(ssConfig);
      });
    });
```

- [ ] **Step 2: Fix navigateHistory suffix for Strange Scenes**

Find:
```js
      const suffix = promptContainerId === 'imagine-prompt' ? 'imagine' : 'just-draw';
```

Replace with:
```js
      const suffix = promptContainerId === 'imagine-prompt' ? 'imagine'
                   : promptContainerId === 'ss-prompt'      ? 'strange-scenes'
                   : 'just-draw';
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: wire Strange Scenes events — home btn, regen, filter, history, copy"
```

---

## Task 7: Smoke-test Strange Scenes end-to-end

- [ ] **Step 1: Start server and open app**

```bash
python3 -m http.server 8080 &
open http://localhost:8080
```

- [ ] **Step 2: Test golden path**

- Tap "Strange Scenes" → screen appears, prompt renders, animation plays
- Tap "↺ new prompt" → new prompt, history dots appear
- Tap ‹ → previous prompt shown with slide animation
- Tap "⧉ copy" → prompt text copied to clipboard

- [ ] **Step 3: Test filter**

- Tap "⊞ filter" → sheet slides up with 6 theme chips: body, objects, shadow, domestic, nature, architecture
- Select "shadow" → pool count appears (should show ~12 prompts)
- Tap "↺ new prompt" → sheet closes, tag indicator shows "any: shadow", new prompt is shadow-themed
- Tap "⊞ filter" again → "shadow" chip is highlighted
- Select "body" → any/all row appears, pool count updates
- Switch to "all" → pool count drops (only prompts with both tags)
- Tap apply → new prompt
- Tap "clear" → chips deselected
- Tap outside sheet → sheet closes without applying

- [ ] **Step 4: Test Everyday Life is unaffected**

- Tap back → home screen
- Tap "Everyday Life" → works normally with filter, regen, history
- Confirm no regressions

- [ ] **Step 5: Kill server**

```bash
kill %1
```

- [ ] **Step 6: Final commit**

```bash
git add index.html
git commit -m "feat: Strange Scenes mode complete — random Topor prompt picker with tag filter"
```
