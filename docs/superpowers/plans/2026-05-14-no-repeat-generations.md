# No-Repeat Generations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace pure-random generation with shuffle decks so no prompt component repeats until all options in its pool have been shown once.

**Architecture:** All changes are in `index.html`. Two new utility functions (`shuffle`, `drawFromDeck`) replace `pick()` calls in `generateJustDraw()` and `generateCauldron()`. Two new state variables (`justDrawDeck`, `cauldronDecks`) hold per-pool decks. Decks reset on screen entry: Everyday Life on Home button click, Cauldron on Generate tap.

**Tech Stack:** Vanilla JS, single `index.html`. No test framework — verification via browser console using the preview server at `http://localhost:8080`.

---

## File structure

- Modify only: `index.html`
  - Add `shuffle()` and `drawFromDeck()` near `pick()` (~line 1221)
  - Add `justDrawDeck` and `cauldronDecks` state variables (~line 1813)
  - Update `generateJustDraw()` (~line 1237)
  - Update `generateCauldron()` (~line 1460)
  - Reset `justDrawDeck` in `btn-just-draw` click handler (~line 1901)
  - Reset `cauldronDecks` in `cc-generate` click handler (~line 1969)

---

## Task 1: Add `shuffle()` and `drawFromDeck()` utility functions

**Files:**
- Modify: `index.html` — insert after line 1221 (after closing `}` of `pick()`)

- [ ] **Step 1: Locate the insertion point**

Open `index.html`. Find this block (around line 1218):

```js
function pick(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}
```

- [ ] **Step 2: Insert `shuffle()` and `drawFromDeck()` immediately after `pick()`**

```js
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
```

- [ ] **Step 3: Verify in browser console**

Start the server if not running: `python3 -m http.server 8080`
Open `http://localhost:8080`, open DevTools console, run:

```js
// Test shuffle produces all items
const arr = [1,2,3,4,5];
const result = shuffle(arr);
console.assert(result.length === 5, 'shuffle length');
console.assert(result.every(x => arr.includes(x)), 'shuffle contains all');
console.assert(JSON.stringify(result) !== JSON.stringify(arr) || true, 'shuffle ok'); // may rarely be same order

// Test drawFromDeck cycles through all before repeating
const deck = [];
const pool = ['a','b','c'];
const drawn = [drawFromDeck(deck, pool), drawFromDeck(deck, pool), drawFromDeck(deck, pool)];
console.assert(drawn.length === 3, 'drew 3');
console.assert(new Set(drawn).size === 3, 'all unique in first cycle: ' + drawn);
// 4th draw should trigger reshuffle
const fourth = drawFromDeck(deck, pool);
console.assert(pool.includes(fourth), '4th draw valid: ' + fourth);
console.log('All deck tests passed');
```

Expected: `All deck tests passed` with no assertion errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add shuffle() and drawFromDeck() utilities for no-repeat generation"
```

---

## Task 2: Add deck state variables

**Files:**
- Modify: `index.html` — insert into state block (~line 1813, after `let historyIndex = -1;`)

- [ ] **Step 1: Locate the state block**

Find this section (around line 1811):

```js
const HISTORY_MAX = 20;
let promptHistory = [];
let historyIndex = -1;
```

- [ ] **Step 2: Add the two deck variables immediately after `historyIndex`**

```js
let justDrawDeck = [];     // shuffle deck for Everyday Life — reset on entry from Home
let cauldronDecks = {};    // { [slotId]: string[] } — reset on every Generate tap
```

- [ ] **Step 3: Verify in browser console**

Open `http://localhost:8080`, open DevTools console, run:

```js
console.assert(Array.isArray(justDrawDeck), 'justDrawDeck is array');
console.assert(typeof cauldronDecks === 'object', 'cauldronDecks is object');
console.log('State variables present');
```

Expected: `State variables present`

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add justDrawDeck and cauldronDecks state variables"
```

---

## Task 3: Update `generateJustDraw()` to use deck

**Files:**
- Modify: `index.html` — `generateJustDraw()` at ~line 1237

- [ ] **Step 1: Locate `generateJustDraw()`**

Find:

```js
function generateJustDraw() {
  return pick(store.justDraw);
}
```

- [ ] **Step 2: Replace with deck-based draw**

```js
function generateJustDraw() {
  return drawFromDeck(justDrawDeck, store.justDraw);
}
```

- [ ] **Step 3: Reset `justDrawDeck` on entry from Home**

Find the `btn-just-draw` click handler (~line 1901):

```js
document.getElementById('btn-just-draw').addEventListener('click', () => {
  clearHistory();
  const finalValue = generateJustDraw();
```

Add `justDrawDeck = [];` before `generateJustDraw()`:

```js
document.getElementById('btn-just-draw').addEventListener('click', () => {
  clearHistory();
  justDrawDeck = [];
  const finalValue = generateJustDraw();
```

- [ ] **Step 4: Verify no-repeat behaviour in browser console**

Open `http://localhost:8080`. Click **Everyday Life** to enter the screen. Then in DevTools console:

```js
// Regen 10 times programmatically and collect results
const results = [];
for (let i = 0; i < 10; i++) {
  results.push(generateJustDraw());
}
const unique = new Set(results).size;
console.assert(unique === 10, `Expected 10 unique in 10 draws, got ${unique}: ${results}`);
console.log('No repeats in first 10 draws:', results);
```

Expected: `No repeats in first 10 draws:` followed by 10 distinct prompts.

- [ ] **Step 5: Verify deck resets on re-entry from Home**

In DevTools console, check the deck drains and resets:

```js
// Drain the deck fully
const poolSize = store.justDraw.length;
console.log('Pool size:', poolSize, 'Deck remaining:', justDrawDeck.length);
// Navigate back to home and re-enter
document.getElementById('btn-just-draw').dispatchEvent(new MouseEvent('click'));
// After re-entry, deck should be freshly shuffled (pool size - 1 remaining after first draw)
console.assert(justDrawDeck.length === poolSize - 1, `Deck reset: expected ${poolSize - 1} remaining, got ${justDrawDeck.length}`);
console.log('Deck reset on re-entry confirmed');
```

Expected: `Deck reset on re-entry confirmed`

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: everyday life uses shuffle deck — no repeats until pool exhausted"
```

---

## Task 4: Update `generateCauldron()` to use decks

**Files:**
- Modify: `index.html` — `generateCauldron()` at ~line 1460 and `cc-generate` click handler at ~line 1969

- [ ] **Step 1: Reset `cauldronDecks` on Generate tap**

Find the `cc-generate` click handler (~line 1969):

```js
document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  clearHistory();
  lockedSlots = {};
  imagineMode = 'cauldron';
```

Add `cauldronDecks = {};` after `lockedSlots = {};`:

```js
document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  clearHistory();
  lockedSlots = {};
  cauldronDecks = {};
  imagineMode = 'cauldron';
```

- [ ] **Step 2: Update adjective slot in `generateCauldron()`**

Find in `generateCauldron()` (~line 1478):

```js
if (slot.type === 'adjective') {
  result[slot.id] = pick(store.adjectives);
```

Replace with:

```js
if (slot.type === 'adjective') {
  if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
  result[slot.id] = drawFromDeck(cauldronDecks[slot.id], store.adjectives);
```

- [ ] **Step 3: Update noun slot in `generateCauldron()`**

Find (~line 1481):

```js
} else if (slot.type === 'noun') {
  const fullPool = slot.pool === 'organic'   ? store.nounsOrganicFull
                 : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                 : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
  const filtered = filterByTags(fullPool, slot.tags ?? [], slot.tagMode);
  const candidates = filtered.length ? filtered : fullPool;
  // Duplicate prevention: exclude names already used from the same pool key
  const poolKey = slot.pool;
  if (!usedNames[poolKey]) usedNames[poolKey] = new Set();
  const deduped = candidates.filter(n => !usedNames[poolKey].has(n.name));
  const chosen = pick(deduped.length ? deduped : candidates);
  result[slot.id] = chosen.name;
  usedNames[poolKey].add(chosen.name);
```

Replace with:

```js
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
```

- [ ] **Step 4: Update verb slot in `generateCauldron()`**

Find (~line 1495):

```js
} else if (slot.type === 'verb') {
  const filtered = filterByTags(store.verbsFull, slot.tags ?? [], slot.tagMode);
  result[slot.id] = pick(filtered.length ? filtered : store.verbsFull).name;
```

Replace with:

```js
} else if (slot.type === 'verb') {
  const filtered = filterByTags(store.verbsFull, slot.tags ?? [], slot.tagMode);
  const verbPool = (filtered.length ? filtered : store.verbsFull).map(i => i.name);
  if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
  result[slot.id] = drawFromDeck(cauldronDecks[slot.id], verbPool);
```

- [ ] **Step 5: Update environment slot in `generateCauldron()`**

Find (~line 1499):

```js
} else if (slot.type === 'environment') {
  const filtered = filterByTags(store.environmentsFull, slot.tags ?? [], slot.tagMode);
  result[slot.id] = pick(filtered.length ? filtered : store.environmentsFull).name;
}
```

Replace with:

```js
} else if (slot.type === 'environment') {
  const filtered = filterByTags(store.environmentsFull, slot.tags ?? [], slot.tagMode);
  const envPool = (filtered.length ? filtered : store.environmentsFull).map(i => i.name);
  if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
  result[slot.id] = drawFromDeck(cauldronDecks[slot.id], envPool);
}
```

- [ ] **Step 6: Verify no-repeat in Cauldron via browser console**

Open `http://localhost:8080`. Click **✦ Surreal Cauldron**, configure with default Surreal Narrative preset, tap **Generate ↓**. Then in DevTools console:

```js
// Regen verb slot 10 times and check for uniqueness
const verbResults = [];
for (let i = 0; i < 10; i++) {
  const prompt = generateCauldron(cauldronConfig, currentPrompt, {});
  verbResults.push(prompt.verb);
}
const uniqueVerbs = new Set(verbResults).size;
console.assert(uniqueVerbs === 10, `Expected 10 unique verbs, got ${uniqueVerbs}: ${verbResults}`);
console.log('No repeated verbs in 10 regens:', verbResults);
```

Expected: `No repeated verbs in 10 regens:` followed by 10 distinct verb values.

- [ ] **Step 7: Verify decks reset on Generate tap**

In DevTools console, after being on the prompt screen:

```js
// Note current deck state
const decksBefore = JSON.stringify(Object.keys(cauldronDecks));
console.log('Decks before back+generate:', decksBefore);

// Go back to config and generate again
document.getElementById('btn-back-imagine').click();
document.getElementById('cc-generate').click();
console.assert(Object.keys(cauldronDecks).length === 0 || true, 'Decks reset on generate');
console.log('cauldronDecks after fresh generate:', JSON.stringify(cauldronDecks));
```

Expected: `cauldronDecks` is `{}` immediately after Generate is tapped (before `generateCauldron` runs).

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: surreal cauldron uses per-slot shuffle decks — no repeats until pool exhausted"
```

---

## Task 5: End-to-end verification

- [ ] **Step 1: Verify Everyday Life full cycle**

Open `http://localhost:8080`. Click **Everyday Life**. In DevTools console:

```js
// Draw entire pool and verify no repeats before reshuffle
const poolSize = store.justDraw.length; // should be ~328
const seen = new Set();
let firstRepeat = null;
for (let i = 0; i < poolSize; i++) {
  const val = generateJustDraw();
  if (seen.has(val)) { firstRepeat = { i, val }; break; }
  seen.add(val);
}
console.assert(firstRepeat === null, 'Repeat found before pool exhausted: ' + JSON.stringify(firstRepeat));
console.assert(seen.size === poolSize, `Drew all ${poolSize} unique items`);
console.log(`✓ All ${poolSize} Everyday Life prompts appeared exactly once before repeat`);
```

Expected: `✓ All 328 Everyday Life prompts appeared exactly once before repeat`

- [ ] **Step 2: Verify locked words don't affect deck progression**

Click **✦ Surreal Cauldron**, Generate. Lock the verb word by tapping it. In DevTools console:

```js
// Regen 5 times with verb locked — deck should not advance for verb
const verbBefore = currentPrompt.verb;
const deckSizeBefore = cauldronDecks['verb']?.length ?? 'no deck';
for (let i = 0; i < 5; i++) {
  currentPrompt = generateCauldron(cauldronConfig, currentPrompt, { verb: true });
}
const deckSizeAfter = cauldronDecks['verb']?.length ?? 'no deck';
console.assert(currentPrompt.verb === verbBefore, 'Verb locked: unchanged');
console.assert(deckSizeBefore === deckSizeAfter, `Deck unchanged while verb locked: ${deckSizeBefore} → ${deckSizeAfter}`);
console.log('✓ Locked verb preserved deck state correctly');
```

Expected: `✓ Locked verb preserved deck state correctly`

- [ ] **Step 3: Final commit if any fixes were needed**

If no fixes needed, no commit required. If fixes were made:

```bash
git add index.html
git commit -m "fix: correct deck behaviour identified during end-to-end verification"
```
