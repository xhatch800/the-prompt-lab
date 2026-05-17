# Shared Prompt Screen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace three near-identical prompt screen divs (`screen-just-draw`, `screen-strange-scenes`, `screen-imagine-prompt`) with a single `#screen-prompt`, driven by a per-mode config object, so chrome changes happen in one place.

**Architecture:** A new `enterMode(config)` function sets `activeConfig` and configures the shared screen before showing it. All event listeners wire once to the shared elements and read from `activeConfig` at call time. Helper functions that previously looked up element IDs via `cfg.ids.*` use the fixed shared IDs directly. No new files — changes are in `index.html` and `app.js` only.

**Tech Stack:** Vanilla HTML/CSS/JS. Served with `python3 -m http.server 8080` locally. GitHub Pages static hosting.

**Branch rule:** NEVER commit to main. All work on a feature branch, merged via PR.

---

## File Structure

- Modify: `index.html` — replace three screen divs with one `#screen-prompt`
- Modify: `app.js` — update configs, helpers, event wiring
- No changes: `style.css` — existing classes (`.screen`, `.back-btn`, `.prompt-text`, etc.) apply unchanged

---

### Task 1: Replace three screen divs in index.html

**Files:**
- Modify: `index.html:426–536`

The current file has three screen divs: `screen-just-draw` (lines 426–463), `screen-strange-scenes` (lines 465–501), and `screen-imagine-prompt` (lines 521–536). Replace all three with a single `#screen-prompt`.

- [ ] **Step 1: Delete the screen-just-draw div**

Remove lines 426–463 from `index.html` (the entire `<!-- Screen: Just Draw Prompt -->` div, including its filter sheet).

Verify:
```bash
grep -c "screen-just-draw" index.html
```
Expected: `0`

- [ ] **Step 2: Delete the screen-strange-scenes div**

Remove the entire `<!-- Screen: Strange Scenes -->` div (including its filter sheet) from `index.html`. It immediately follows where the just-draw div was.

Verify:
```bash
grep -c "screen-strange-scenes" index.html
```
Expected: `0`

- [ ] **Step 3: Replace screen-imagine-prompt with screen-prompt**

Find the `<!-- Screen: Imagination Prompt -->` div and replace the entire block with:

```html
  <!-- Screen: Shared Prompt -->
  <div id="screen-prompt" class="screen">
    <div class="back-row">
      <button id="prompt-back-btn" class="back-btn">←</button>
      <span id="prompt-screen-label" class="screen-label"></span>
    </div>
    <div class="pm-header-right">
      <button id="prompt-filter-btn" class="pm-filter-btn">⊞ filter</button>
      <button class="copy-btn" id="prompt-copy-btn" title="Copy prompt">⧉ copy</button>
    </div>
    <div id="prompt-content" class="prompt-text"></div>
    <p id="prompt-tag-indicator" class="pm-tag-indicator"></p>
    <p id="prompt-lock-hint" class="lock-hint hidden">tap a word to lock it</p>
    <button id="prompt-regen-btn" class="regen-btn">↺ new prompt</button>
    <div class="history-nav" id="prompt-history-nav">
      <button class="hist-arrow" id="prompt-hist-prev">‹</button>
      <div class="hist-dots" id="prompt-hist-dots"></div>
      <button class="hist-arrow" id="prompt-hist-next">›</button>
    </div>
    <!-- Filter sheet overlay -->
    <div id="prompt-filter-backdrop" class="pm-filter-backdrop"></div>
    <div id="prompt-filter-sheet" class="pm-filter-sheet hidden">
      <div id="prompt-sheet-title" class="pm-sheet-title"></div>
      <p class="pm-sheet-subtitle">All prompts shown when nothing selected</p>
      <div id="prompt-tag-chips" class="pm-tag-chips"></div>
      <div id="prompt-any-all-row" class="pm-any-all-row hidden">
        <span class="pm-any-all-label">match</span>
        <div class="pm-any-all-toggle">
          <button class="pm-aa-btn active" data-mode="any">any</button>
          <button class="pm-aa-btn" data-mode="all">all</button>
        </div>
        <span id="prompt-pool-count" class="pm-pool-count"></span>
      </div>
      <div class="pm-sheet-actions">
        <button id="prompt-clear-btn" class="pm-clear-btn">clear</button>
        <button id="prompt-apply-btn" class="pm-apply-btn">↺ new prompt</button>
      </div>
    </div>
  </div>
```

Verify:
```bash
grep -c "screen-imagine-prompt" index.html
grep -c "screen-prompt" index.html
grep -c "prompt-content" index.html
```
Expected: `0`, `1`, `1`

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: replace three prompt screens with single #screen-prompt"
```

The page will be broken until app.js is updated. That's expected.

---

### Task 2: Update config objects, add activeConfig and enterMode

**Files:**
- Modify: `app.js:616–692` (config declarations and clearHistory)

**Context:** `cauldronConfig` (line 616) is the existing build config (slots/preset) used by `generateCauldron()` — do NOT rename it. The new mode config for the cauldron prompt screen is named `cauldronModeConfig`.

- [ ] **Step 1: Add activeConfig, add cauldronModeConfig, update jdConfig and ssConfig**

At line 616 in `app.js`, the current block looks like:

```js
    let cauldronConfig = null;       // { preset, slots } — set by initCauldronConfig()

    let imagineMode = 'cauldron';
    let promptBackTarget = null;
    let currentPrompt = null;
    ...
    const jdConfig = {
      getPool:   () => store.justDraw,
      getNames:  () => store.justDrawNames,
      textField: 'name',
      sheetTitle: 'Filter by subject',
      deck:       [],
      activeTags: [],
      tagMode:    'any',
      sheetTags:  [],
      sheetMode:  'any',
      ids: {
        promptEl:       'just-draw-prompt',
        ...
      }
    };

    const ssConfig = {
      getPool:   () => store.strangeScenes,
      getNames:  () => store.strangeSceneTexts,
      textField: 'text',
      sheetTitle: 'Filter by theme',
      deck:       [],
      activeTags: [],
      tagMode:    'any',
      sheetTags:  [],
      sheetMode:  'any',
      ids: {
        promptEl:       'ss-prompt',
        ...
      }
    };
```

Replace the `imagineMode`, `promptBackTarget` declarations, and both config objects with:

```js
    let activeConfig = null;
    let currentPrompt = null;

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

    const cauldronModeConfig = {
      label:      'Surreal Cauldron',
      backTarget: 'screen-cauldron-config',
      hasFilter:  false,
      renderMode: 'cauldron',
    };
```

Keep the `let cauldronConfig = null;` and `let currentPrompt = null;` lines — only remove `imagineMode` and `promptBackTarget`.

Verify:
```bash
grep -n "imagineMode\|promptBackTarget" app.js
```
Expected: no declarations (only any remaining usages we'll fix in Task 4)

- [ ] **Step 2: Update clearHistory to use the single shared history nav ID**

Find `clearHistory()` (around line 686). It currently removes `visible` from three history nav elements. Replace the body with:

```js
    function clearHistory() {
      promptHistory = [];
      historyIndex = -1;
      document.getElementById('prompt-history-nav').classList.remove('visible');
    }
```

- [ ] **Step 3: Add enterMode function**

Add this function immediately after `clearHistory()`:

```js
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
```

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "refactor: add activeConfig, enterMode, cauldronModeConfig; update jdConfig/ssConfig"
```

---

### Task 3: Update helper functions to use shared element IDs

**Files:**
- Modify: `app.js:704–880` (renderHistoryWidget, navigateHistory, regenPoolMode, renderFilterSheet, openFilterSheet, closeFilterSheet, updateFilterBtn, updateTagIndicator)

All these functions currently look up element IDs from `cfg.ids.*`. After this task they use the fixed shared IDs directly.

- [ ] **Step 1: Update renderHistoryWidget**

Find `function renderHistoryWidget(navId, dotsId, prevId, nextId)` (line 704). Replace the entire function with:

```js
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
```

- [ ] **Step 2: Update navigateHistory**

Find `function navigateHistory(direction, promptContainerId, mode)` (line 735). Replace the entire function with:

```js
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
```

- [ ] **Step 3: Update regenPoolMode**

Find `function regenPoolMode(cfg)` (line 786). Replace the body:

```js
    function regenPoolMode(cfg) {
      const finalValue = generateFromPool(cfg);
      const el = document.getElementById('prompt-content');
      el.textContent = finalValue;
      animateSlot(el, cfg.getNames(), finalValue, 1200);
      pushToHistory(finalValue);
      renderHistoryWidget();
    }
```

- [ ] **Step 4: Update renderFilterSheet**

Find `function renderFilterSheet(cfg)` (line 795). Replace `const ids = cfg.ids;` and all `ids.*` lookups with fixed IDs, and add the sheet title update:

```js
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
```

- [ ] **Step 5: Update addSwipe to use the simplified navigateHistory signature**

Find `function addSwipe(elementId, containerId, getMode)` (around line 1091). Replace the entire function with:

```js
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

- [ ] **Step 6: Update openFilterSheet, closeFilterSheet, updateFilterBtn, updateTagIndicator**

Replace each function body:

```js
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

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "refactor: update helper functions to use shared prompt screen IDs"
```

---

### Task 4: Consolidate event wiring

**Files:**
- Modify: `app.js:882–1106` (all per-mode event listeners, home button handlers, cauldron generate handler)

Remove all the duplicated per-mode event wiring and replace with one set of shared listeners. Update home button handlers to call `enterMode`.

- [ ] **Step 1: Remove the Everyday Life filter event wiring block**

Find and delete the block labeled `// ── Everyday Life filter event wiring ────` (around line 882). Remove:
- `jd-filter-btn` click listener
- `jd-filter-backdrop` click listener
- `jd-clear-btn` click listener
- `jd-apply-btn` click listener
- `#jd-any-all-row .pm-aa-btn` forEach listener

- [ ] **Step 2: Replace btn-just-draw and btn-regen-just-draw handlers**

Find the `btn-just-draw` click listener. Replace both the `btn-just-draw` and `btn-regen-just-draw` handlers with:

```js
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
```

(The regen button is now handled by the shared `prompt-regen-btn` listener added in Step 6.)

- [ ] **Step 3: Replace btn-strange-scenes handler and remove Strange Scenes filter wiring**

Find the `btn-strange-scenes` click listener and the `// Strange Scenes filter sheet` block. Replace both:

```js
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
```

Remove:
- `ss-filter-btn` click listener
- `ss-filter-backdrop` click listener
- `ss-clear-btn` click listener
- `ss-apply-btn` click listener
- `#ss-any-all-row .pm-aa-btn` forEach listener
- `btn-regen-strange-scenes` click listener

- [ ] **Step 4: Update the cc-generate handler**

Find the `cc-generate` click listener. Replace it with:

```js
    document.getElementById('cc-generate').addEventListener('click', () => {
      clearHistory();
      lockedSlots = {};
      currentPrompt = generateCauldron(cauldronConfig, null, {});
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
```

- [ ] **Step 5: Remove the old btn-regen-imagine, btn-back-imagine, history nav, copy, and swipe wiring**

Find and remove these listeners:
- `btn-regen-imagine` click listener (the old cauldron regen — replaced by shared `prompt-regen-btn`)
- `btn-back-imagine` click listener
- `hist-prev-imagine`, `hist-next-imagine` click listeners
- `hist-prev-just-draw`, `hist-next-just-draw` click listeners
- `hist-prev-strange-scenes`, `hist-next-strange-scenes` click listeners
- `setupCopyBtn('copy-just-draw', ...)` call
- `setupCopyBtn('copy-imagine', ...)` call
- `setupCopyBtn('copy-strange-scenes', ...)` call
- `addSwipe('just-draw-prompt', ...)` call

- [ ] **Step 6: Add shared prompt screen event wiring**

Add this block in place of everything removed above:

```js
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
```

- [ ] **Step 7: Verify no stale element IDs remain**

```bash
grep -n "just-draw-prompt\|ss-prompt\|imagine-prompt\|copy-just-draw\|copy-strange-scenes\|copy-imagine\|hist-prev-just\|hist-prev-strange\|hist-prev-imagine\|btn-back-imagine\|btn-regen-just\|btn-regen-strange\|btn-regen-imagine\|jd-filter\|ss-filter\|imagineMode\|promptBackTarget" app.js
```

Expected: no output (or only occurrences inside comments). If any remain, remove them.

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "refactor: consolidate prompt screen event wiring to single shared set"
```

---

### Task 5: Regression smoke test

**Files:** none — browser verification only

Start the server from the repo root:
```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` and verify each mode end to end.

- [ ] **Everyday Life**
  - Tap → prompt renders in `#prompt-content`
  - ↺ new prompt → different prompt appears
  - ⊞ filter opens sheet with "Filter by subject" title and subject chips
  - Select 1+ tags → pool count updates
  - Apply → new prompt matches selected tags
  - Clear → all prompts eligible again
  - Any / All toggle updates chip state and count
  - ⧉ copy → button flashes ✓, text is on clipboard
  - ‹ › arrows navigate history, dots update
  - Swipe left/right on prompt navigates history
  - ← Back returns to home screen

- [ ] **Strange Scenes**
  - Tap → prompt renders
  - ↺ new prompt → different prompt
  - ⊞ filter opens sheet with "Filter by theme" title and theme chips
  - Select tags, apply, clear, any/all all work
  - ⧉ copy works
  - History nav (arrows, dots, swipe) works
  - ← Back returns to home

- [ ] **Surreal Cauldron**
  - Tap → cauldron config screen loads
  - Configure components, tap Generate → prompt screen appears with slot-based prompt
  - No ⊞ filter button visible
  - "tap a word to lock it" hint visible
  - Words are clickable (bold = locked)
  - ↺ new prompt → unlocked slots regenerate, locked slots unchanged
  - ⧉ copy → copies plain text
  - History nav (arrows, dots) works
  - ← Back returns to cauldron config screen (not home)

- [ ] **No console errors** on load or during any interaction (DevTools → Console)

- [ ] **Commit** (if any fixes were needed during smoke test)

```bash
git add index.html app.js
git commit -m "fix: smoke test corrections for shared prompt screen"
```
