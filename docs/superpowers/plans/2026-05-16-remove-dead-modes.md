# Remove Dead Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete all HTML and JavaScript belonging to the abandoned Surreal Narratives and Strange Combinations modes from `index.html`.

**Architecture:** Pure deletion across two passes — HTML first, then JavaScript. No new code written. No CSS changes needed. Verification is a browser smoke test after each task.

**Tech Stack:** Vanilla HTML/CSS/JS, single file (`index.html`), no build step. Run with `python3 -m http.server 8080` from the repo root.

---

## File Structure

- Modify: `index.html` (all changes are in this file)

---

### Task 1: Remove dead HTML

**Files:**
- Modify: `index.html:1353-1372`

The home screen has two commented-out buttons that will never be uncommented. Below them sits the entire `screen-mutations-type` div — a screen that is unreachable because its home button is commented out.

- [ ] **Step 1: Delete the two commented-out home buttons**

Find and remove these two lines (currently ~1353–1354):

```html
<!--      <button id="btn-surreal" class="mode-btn">Surreal Narratives</button>-->
<!--      <button id="btn-mutations" class="mode-btn">Strange Combinations</button>-->
```

After removal, the `.mode-buttons` div should contain only:

```html
    <div class="mode-buttons">
      <button id="btn-just-draw" class="mode-btn">Everyday Life</button>
      <button id="btn-strange-scenes" class="mode-btn" disabled>Strange Scenes</button>
      <button id="btn-cauldron" class="mode-btn">✦ Surreal Cauldron</button>
    </div>
```

- [ ] **Step 2: Delete the `screen-mutations-type` block**

Find and remove the comment and entire div (currently ~1359–1372):

```html
  <!-- Screen: Strange Combinations Type Picker -->
  <div id="screen-mutations-type" class="screen">
    <div class="back-row">
      <button class="back-btn" data-target="screen-home">←</button>
      <span class="screen-label">Strange Combinations</span>
    </div>
    <h2>Strange Combinations</h2>
    <div class="mode-buttons">
      <button id="btn-type-organic-organic" class="mode-btn">Organic + Organic</button>
      <button id="btn-type-organic-synthetic" class="mode-btn">Organic + Synthetic</button>
      <button id="btn-type-synthetic-synthetic" class="mode-btn">Synthetic + Synthetic</button>
      <button id="btn-type-random" class="mode-btn">Random</button>
    </div>
  </div>
```

- [ ] **Step 3: Verify in browser**

Start server if not running: `python3 -m http.server 8080` from repo root.

Open `http://localhost:8080`. Check:
- Home screen shows exactly 3 buttons: Everyday Life, Strange Scenes, ✦ Surreal Cauldron
- No console errors (open DevTools → Console)

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "chore: remove Surreal Narratives and Strange Combinations dead HTML"
```

---

### Task 2: Remove dead JavaScript

**Files:**
- Modify: `index.html` (JS section)

Four JS remnants remain after the HTML is gone:
1. Two commented-out `disabled` lines in the `init()` preamble (~line 1454)
2. The `/** ... **/` block with the old `btn-surreal` and `btn-mutations` click handlers (~line 2350)
3. The active `forEach` block wiring the four `btn-type-*` buttons (~line 2416)
4. Four commented-out enable/disable lines in the data load success and catch blocks (~lines 2571–2578)

- [ ] **Step 1: Delete the two commented-out `disabled` lines in the preamble**

Find and remove these two lines (near top of `<script>`, just after `document.getElementById('btn-just-draw').disabled = true;`):

```js
    // document.getElementById('btn-surreal').disabled = true;
    // document.getElementById('btn-mutations').disabled = true;
```

- [ ] **Step 2: Delete the `/** ... **/` commented block**

Find and remove the entire block including delimiters (~lines 2350–2372):

```js
    /**
    document.getElementById('btn-surreal').addEventListener('click', () => {
      clearHistory();
      imagineMode = 'surreal';
      promptBackTarget = 'screen-home';
      currentPrompt = generateSurrealNarrative(null, {});
      document.getElementById('imagine-screen-label').textContent = 'Surreal Narratives';
      showScreen('screen-imagine-prompt');
      const container = document.getElementById('imagine-prompt');
      renderPrompt(container, 'surreal');
      const hint = document.getElementById('lock-hint-imagine');
      hint.classList.add('animating');
      animateUnlockedSlots(container);
      setTimeout(() => hint.classList.remove('animating'), 1200);
      pushToHistory(currentPrompt);
      renderHistoryWidget('history-nav-imagine', 'hist-dots-imagine', 'hist-prev-imagine', 'hist-next-imagine');
    });

    document.getElementById('btn-mutations').addEventListener('click', () => {
      showScreen('screen-mutations-type');
    });

    **/
```

- [ ] **Step 3: Delete the active `btn-type-*` forEach block**

Find and remove the entire forEach block (~lines 2416–2434):

```js
    ['organic-organic', 'organic-synthetic', 'synthetic-synthetic', 'random'].forEach(type => {
      document.getElementById(`btn-type-${type}`).addEventListener('click', () => {
        clearHistory();
        imagineMode = 'mutations';
        mutationType = type;  // 'random' stays 'random' — each regen re-rolls the concrete type
        promptBackTarget = 'screen-mutations-type';
        currentPrompt = generateMutation(type, null, {});
        document.getElementById('imagine-screen-label').textContent = 'Strange Combinations';
        showScreen('screen-imagine-prompt');
        const container = document.getElementById('imagine-prompt');
        renderPrompt(container, 'mutations');
        const hint = document.getElementById('lock-hint-imagine');
        hint.classList.add('animating');
        animateUnlockedSlots(container);
        setTimeout(() => hint.classList.remove('animating'), 1200);
        pushToHistory(currentPrompt);
        renderHistoryWidget('history-nav-imagine', 'hist-dots-imagine', 'hist-prev-imagine', 'hist-next-imagine');
      });
    });
```

- [ ] **Step 4: Delete the four commented-out enable/disable lines in the data load callbacks**

In the `try` block (data load success), remove:

```js
        // document.getElementById('btn-surreal').disabled = false;
        // document.getElementById('btn-mutations').disabled = false;
```

In the `catch` block (data load failure), remove:

```js
        // document.getElementById('btn-surreal').disabled = true;
        //document.getElementById('btn-mutations').disabled = true;
```

- [ ] **Step 5: Verify in browser**

Reload `http://localhost:8080`. Check:
- No console errors on load
- Everyday Life: tap → prompt renders, regen works, filter works
- Strange Scenes: tap → prompt renders, regen works, filter works
- Surreal Cauldron: tap → config screen loads, generate works

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "chore: remove Surreal Narratives and Strange Combinations dead JavaScript"
```
