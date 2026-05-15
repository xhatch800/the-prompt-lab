# No-Repeat Generations — Design Spec

## Goal

Prevent prompt components and phrases from repeating in regens until every item in the active pool has been shown once. Applies to Everyday Life and Surreal Cauldron.

---

## Mechanism: Shuffle Deck

Replace `pick(pool)` (pure `Math.random()`, repeats freely) with a deck-based draw.

Each pool maintains a shuffled copy of its items as a deck. Generation pops the last item from the deck. When the deck empties, the full pool is reshuffled into the deck and drawing continues. This guarantees no repeat until every item has appeared once per cycle.

**New functions (added near existing `pick()`):**

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
  if (deck.length === 0) {
    const reshuffled = shuffle(pool);
    deck.push(...reshuffled);
  }
  return deck.pop();
}
```

`deck` is an array mutated in place. `pool` is the source of truth used to refill when exhausted.

---

## Everyday Life

**New state variable:**

```js
let justDrawDeck = [];
```

**Reset trigger:** set `justDrawDeck = []` when `btn-just-draw` is clicked (entering from Home). Not reset when navigating back from prompt screen (Everyday Life has only one entry point anyway).

**Generation change:**

```js
// Before
function generateJustDraw() {
  return pick(store.justDraw);
}

// After
function generateJustDraw() {
  return drawFromDeck(justDrawDeck, store.justDraw);
}
```

---

## Surreal Cauldron

**New state variable:**

```js
let cauldronDecks = {};
// Shape: { [slotId]: string[] }
// Each value is a mutable deck for that slot's current pool.
```

**Reset trigger:** clear `cauldronDecks = {}` immediately before navigating to the prompt screen when Generate is tapped. This means every fresh entry to the prompt screen starts with clean decks. Backing from prompt → config → Generate again resets decks.

**Generation change in `generateCauldron()`:**

For each unlocked slot, replace `pick(filteredPool)` with `drawFromDeck(cauldronDecks[slot.id], filteredPool)`:

```js
// Adjective
if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
result[slot.id] = drawFromDeck(cauldronDecks[slot.id], store.adjectives);

// Noun
const fullPool = /* existing pool resolution */;
const filtered = filterByTags(fullPool, slot.tags, slot.tagMode);
const pool = filtered.length ? filtered : fullPool;
const deduped = pool.filter(n => !usedNames[poolKey]?.has(n.name));
const drawPool = deduped.length ? deduped : pool;
if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
const chosen = drawFromDeck(
  cauldronDecks[slot.id],
  drawPool.map(n => n.name)
);
result[slot.id] = chosen;
usedNames[poolKey].add(chosen);

// Verb
const verbPool = filterByTags(store.verbsFull, slot.tags, slot.tagMode);
const effectiveVerbPool = (verbPool.length ? verbPool : store.verbsFull).map(i => i.name);
if (!cauldronDecks[slot.id]) cauldronDecks[slot.id] = [];
result[slot.id] = drawFromDeck(cauldronDecks[slot.id], effectiveVerbPool);

// Environment (same pattern as Verb)
```

**Note on cross-regen deck consistency:** the deck for each slot is initialised lazily on first draw. If the filtered pool changes between regens (e.g. user locked a word, went back, changed nothing, hit regen) the deck continues from where it left off — this is correct because the pool hasn't changed. Decks only fully reset on the next Generate tap from config.

---

## Locked words

No change. Locked slots skip `drawFromDeck` entirely and preserve the previous value. The deck for a locked slot advances only when that slot is unlocked and regenerated.

---

## Reset summary

| Event | Decks reset |
|-------|------------|
| `btn-just-draw` clicked from Home | `justDrawDeck = []` |
| Generate tapped on cauldron config | `cauldronDecks = {}` |
| Backing from prompt → config | No reset |
| Navigating history (‹ ›) | No reset (history replay, not generation) |
| App reload | All decks reset (session memory) |

---

## What is not changing

- `pick()` — kept for any internal use not related to prompt generation
- All history, locking, animation, and navigation logic
- `generateSurrealNarrative()`, `generateMutation()` — these modes are currently unreachable from the UI; out of scope
- Data files
