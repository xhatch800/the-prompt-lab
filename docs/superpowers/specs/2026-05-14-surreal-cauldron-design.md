# Surreal Cauldron — Design Spec

## Goal

Add a fourth prompt mode — Surreal Cauldron — that lets users build their own prompt by choosing components (Adjective, Noun, Verb, Environment) and optionally filtering each by tags drawn from the data files. The generated prompt feeds into the existing prompt screen with all current features intact (locking, regen, history, wallpaper).

---

## Approach

Layer on existing infrastructure (Approach A). No new prompt screen — cauldron reuses `screen-imagine-prompt` with `imagineMode = 'cauldron'`. New config screen added. All changes in `index.html`.

---

## Navigation Flow

```
Home → [Surreal Cauldron] → screen-cauldron-config → [Generate ↓] → screen-imagine-prompt
                                      ↑                                        |
                                      └──────────── [← back] ─────────────────┘
```

- Back on `screen-cauldron-config` → Home, clears `cauldronConfig`
- Back on `screen-imagine-prompt` (when entered from cauldron) → `screen-cauldron-config` via existing `promptBackTarget` mechanism

---

## Data Model

### Store additions

Tagged files are currently loaded and stripped to name-only arrays. Add parallel full-object arrays without changing existing ones:

```js
store.nounsOrganicFull    // [{name, tags}]
store.nounsSyntheticFull  // [{name, tags}]
store.verbsFull           // [{name, tags}]
store.environmentsFull    // [{name, tags}]
// existing store.nounsOrganic, store.nounsSynthetic, store.verbs, store.environments unchanged
```

Extract unique tags dynamically from each file after loading:

```js
store.nounsOrganicTags    = [...new Set(store.nounsOrganicFull.flatMap(i => i.tags))].sort()
store.nounsSyntheticTags  = [...new Set(store.nounsSyntheticFull.flatMap(i => i.tags))].sort()
store.verbsTags           = [...new Set(store.verbsFull.flatMap(i => i.tags))].sort()
store.environmentsTags    = [...new Set(store.environmentsFull.flatMap(i => i.tags))].sort()
```

Tags are always sorted alphabetically. Tag lists update automatically if data files change.

### Cauldron config object

Module-level `cauldronConfig` variable. Persists while on config or prompt screen. Cleared when navigating back to Home.

```js
let cauldronConfig = {
  preset: 'surreal',   // 'surreal' | 'strange' — tracks which preset chip is active
  slots: [
    { id: 'adjective',   type: 'adjective',   enabled: true  },
    { id: 'noun_1',      type: 'noun',         enabled: true,  pool: 'either', tags: [], tagMode: 'any' },
    { id: 'verb',        type: 'verb',         enabled: true,  tags: [], tagMode: 'any' },
    { id: 'environment', type: 'environment',  enabled: true,  tags: [], tagMode: 'any' },
  ]
};
```

Noun slots can be added (noun_1, noun_2, noun_3, noun_4). Max 4 nouns total. Slots always rendered in canonical order: adjective → all nouns → verb → environment.

### Generated prompt object

Keys are slot `id`s from active config slots:

```js
currentPrompt = { adjective: 'luminous', noun_1: 'whale', verb: 'melting', environment: 'underwater' }
```

Feeds directly into existing `lockedSlots`, `promptHistory`, and `renderPrompt()`.

---

## Config Screen (`screen-cauldron-config`)

### Preset strip

Two chips at the top. Tapping a preset re-initialises `cauldronConfig.slots` to that preset's default state.

| Preset | Default slots | Can toggle off? | Can add other components? | Can add more nouns? |
|---|---|---|---|---|
| Surreal Narrative | Adjective + Noun + Verb + Environment | Yes (any) | Yes | Yes |
| Strange Combinations | Noun 1 + Noun 2 | No — nouns only | No | Yes |

### Component rows

Fixed canonical order. Only **active** (enabled) slots are rendered — off slots are hidden, not dimmed.

**Adjective row** (on/off toggle, no tag picker — adjectives are untagged):
```
[ Adjective ]  [untagged]  [toggle]
```

**Noun row** (on/off toggle + pool selector + tag picker):
```
[ Noun N ]  [remove?]  [toggle]
[ Organic | Either | Synthetic ]
[ tag chips... ]  [ + tag ▾ ]
```
- "remove" link appears on noun_2 and beyond (noun_1 cannot be removed)
- Pool selector: Organic / Either / Synthetic — default Either

**Verb / Environment rows** (on/off toggle + tag picker):
```
[ Verb ]  [toggle]
[ tag chips... ]  [ + tag ▾ ]
```

### Tag picker (inline expansion)

Tapping `+ tag ▾` on a component expands a panel directly below that row:

- Header: "Available tags — alphabetical"
- Tags rendered as selectable chips, alphabetically sorted
- Already-selected tags shown highlighted with ✓
- For Noun slots: available tags are derived from the selected pool (Organic → `nounsOrganicTags`, Synthetic → `nounsSyntheticTags`, Either → union of both, sorted)
- Tapping a tag toggles it selected/unselected
- "done" link or tapping outside collapses the panel
- When ≥1 tag selected, ANY/ALL toggle appears above the tag chips

**ANY/ALL toggle:**
```
[ ANY | ALL ]  tag1 ×  tag2 ×  + tag ▾
```
- ANY (default): pool filtered to items matching at least one selected tag (union)
- ALL: pool filtered to items matching every selected tag (intersection)

### Add controls (bottom of component list)

**Surreal Narrative preset:**
```
+ add another Noun  ·  + add component
```
`+ add component` reveals a small tray of inactive component chips (Adjective, Verb, Environment — only those currently off). Tapping one enables it in its canonical position.

**Strange Combinations preset:**
```
+ add another Noun
```
No `+ add component`. Locked to nouns only.

### Generate button

- Disabled (greyed) when zero slots are enabled
- Tapping generates prompt via `generateCauldron()`, sets `imagineMode = 'cauldron'`, sets `promptBackTarget = 'screen-cauldron-config'`, navigates to `screen-imagine-prompt`

### Scrolling

`screen-cauldron-config` uses `overflow-y: auto` so the screen scrolls when many noun slots are expanded with tag pickers open.

---

## Generation Logic

### `generateCauldron(config, current, locked)`

```js
function generateCauldron(config, current, locked) {
  const result = {};
  const prev = current || {};
  const activeSlots = config.slots.filter(s => s.enabled);

  for (const slot of activeSlots) {
    if (locked[slot.id]) { result[slot.id] = prev[slot.id]; continue; }

    if (slot.type === 'adjective') {
      result[slot.id] = pick(store.adjectives);

    } else if (slot.type === 'noun') {
      const fullPool = slot.pool === 'organic'   ? store.nounsOrganicFull
                     : slot.pool === 'synthetic' ? store.nounsSyntheticFull
                     : [...store.nounsOrganicFull, ...store.nounsSyntheticFull];
      const filtered = filterByTags(fullPool, slot.tags, slot.tagMode);
      result[slot.id] = pick(filtered.length ? filtered : fullPool).name;

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

### `filterByTags(pool, tags, tagMode)`

```js
function filterByTags(pool, tags, tagMode) {
  if (!tags.length) return pool;
  return tagMode === 'all'
    ? pool.filter(item => tags.every(t => item.tags.includes(t)))
    : pool.filter(item => tags.some(t => item.tags.includes(t)));
}
```

### Duplicate noun prevention

After generating all noun slots, scan for duplicates within the same pool. If noun_N matches any earlier noun drawn from the same pool, re-pick from that pool excluding already-used values. Same logic as existing `generateMutation()`.

### Empty filtered pool fallback

If tag combination produces zero matches, fall back to the full unfiltered pool for that slot. No error shown — generation always succeeds.

---

## Prompt Screen Integration

### `renderPrompt()` — cauldron mode

Add a `'cauldron'` path that reads slot ids from active config:

```js
const slots = mode === 'cauldron'
  ? cauldronConfig.slots.filter(s => s.enabled).map(s => s.id)
  : mode === 'surreal' ? ['adjective', 'noun', 'verb', 'environment']
  : ['noun1', 'noun2'];
```

Slot labels shown in the prompt use the slot `type` for display (e.g. "noun_2" renders the word value, not the id).

### Back navigation label

Screen label on `screen-imagine-prompt` shows "Surreal Cauldron" when `imagineMode === 'cauldron'`.

### All existing features unchanged

- Locking / unlocking slots
- Slot-machine animation on unlocked slots
- Regen button (`pushToHistory`, `renderHistoryWidget`)
- History navigation (← ›, dot trail, swipe)
- Wallpaper dimming
- `clearHistory()` on entry

---

## New HTML Elements

| Element | Purpose |
|---|---|
| `btn-cauldron` | 4th button on home screen |
| `screen-cauldron-config` | New config screen |
| `btn-cauldron-back` | Back button on config screen → home |
| `preset-surreal` / `preset-strange` | Preset chips |
| Per-slot toggle, pool selector, tag picker | Rendered dynamically via JS into config screen |

---

## New JS Variables

| Variable | Purpose |
|---|---|
| `cauldronConfig` | Current config state (slots, preset, tags) |
| `store.nounsOrganicFull` etc. | Full tagged objects for filtering |
| `store.nounsOrganicTags` etc. | Sorted unique tag arrays for picker UI |

---

## New JS Functions

| Function | Purpose |
|---|---|
| `initCauldronConfig(preset)` | Resets `cauldronConfig` to a preset's defaults |
| `renderCauldronConfig()` | Re-renders the entire config screen from `cauldronConfig` state |
| `generateCauldron(config, current, locked)` | Generates prompt object from config |
| `filterByTags(pool, tags, tagMode)` | Filters a tagged pool by selected tags |

---

## What Is NOT Changing

- Existing Sparks, Surreal Narratives, Strange Combinations modes
- `renderPrompt()` internals beyond the new cauldron mode path
- `generateSurrealNarrative()`, `generateMutation()`, `generateJustDraw()`
- `lockedSlots`, `promptHistory`, `historyIndex`, `navigateHistory()`
- Wallpaper layer, animations, back navigation routing for existing modes
- Data files
- Component reordering (not supported — fixed canonical order)
- Multiple Verbs, Adjectives, or Environments (not supported — only Nouns stack)
