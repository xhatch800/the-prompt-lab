# Strange Scenes — Design Spec

**Date:** 2026-05-16
**Feature:** IDEA-008 — Integrate Topor full prompts into the app as a new "Strange Scenes" mode

---

## Summary

Add a "Strange Scenes" mode to the home screen. It draws randomly from ~50 curated Roland Topor-inspired full prompts, with tag-based filtering. The experience mirrors "Everyday Life" exactly: its own dedicated screen, filter sheet, regen, history, and copy — no component locking (prompts are atomic).

**Approach:** Refactor Everyday Life's bespoke filter sheet code into shared parameterized abstractions, then build Strange Scenes on top of those same abstractions. No duplication between the two modes.

The Topor component words (adjectives, nouns, verbs) were added to the existing data pools separately and are not part of this feature.

---

## Data

**New file:** `data/strange_scenes.json`

Array of prompt objects, each with `text` (string) and `tags` (array of strings).

```json
[
  { "text": "A man using his own ribs as the rungs of a ladder.", "tags": ["body"] },
  { "text": "A typewriter where the keys are individual human teeth.", "tags": ["objects", "body"] }
]
```

**Tag vocabulary:**

| Tag | Theme |
|---|---|
| `body` | Anatomy, flesh, organs, skin, teeth, hair |
| `objects` | Everyday objects transformed or behaving wrongly |
| `shadow` | Shadows, reflections, mirrors, doubles |
| `domestic` | Home, dinner, social scenes, interiors |
| `nature` | Birds, trees, flowers, sky |
| `architecture` | Buildings, stairs, windows, rooms |

All ~50 prompts from `references/topor-prompts.md` are tagged and included.

---

## Shared Abstractions (Refactor)

Everyday Life's filter sheet is currently bespoke: hardcoded to `jd-*` element IDs and `store.justDraw`. This refactor extracts it into parameterized functions that both modes share.

### Mode Config Object

Each pool mode (Everyday Life, Strange Scenes) is described by a config object:

```js
{
  pool: [],            // full data array (e.g. store.justDraw or store.strangeScenes)
  tags: [],            // available tag strings for this mode
  deck: [],            // shuffle deck (no-repeat); reset on home entry
  activeTags: [],      // applied filter (empty = no filter)
  tagMode: 'any',      // 'any' | 'all'
  ids: {               // element IDs specific to this mode's screen
    screen: '',
    promptEl: '',
    tagIndicator: '',
    regenBtn: '',
    filterBtn: '',
    filterBackdrop: '',
    filterSheet: '',
    tagChips: '',
    anyAllRow: '',
    aaBtns: '',        // CSS selector for any/all buttons in this sheet
    poolCount: '',
    clearBtn: '',
    applyBtn: '',
    histNav: '',
    histDots: '',
    histPrev: '',
    histNext: '',
    copyBtn: ''
  }
}
```

### Shared Functions (replacing bespoke `jd*` functions)

| New function | Replaces |
|---|---|
| `renderFilterSheet(cfg)` | `renderJdSheet()` |
| `openFilterSheet(cfg)` | `openJdFilterSheet()` |
| `closeFilterSheet(cfg)` | `closeJdFilterSheet()` |
| `applyFilter(cfg)` | `applyJdFilter()` |
| `updateFilterBtn(cfg)` | `updateJdFilterBtn()` |
| `updateTagIndicator(cfg)` | `updateJdTagIndicator()` |
| `generateFromPool(cfg)` | `generateJustDraw()` |
| `regenPoolMode(cfg)` | inline regen logic in event listeners |

Each function takes the mode's config object and operates on its `ids` and state — no hardcoded `jd-*` references.

### CSS Classes

Rename `jd-*` filter sheet classes to shared `pm-*` (pool mode) classes:

| Old (Everyday Life only) | New (shared) |
|---|---|
| `.jd-filter-btn` | `.pm-filter-btn` |
| `.jd-filter-backdrop` | `.pm-filter-backdrop` |
| `.jd-filter-sheet` | `.pm-filter-sheet` |
| `.jd-chip` | `.pm-chip` |
| `.jd-any-all-row` | `.pm-any-all-row` |
| `.jd-aa-btn` | `.pm-aa-btn` |
| `.jd-pool-count` | `.pm-pool-count` |
| `.jd-sheet-actions` | `.pm-sheet-actions` |
| `.jd-clear-btn` | `.pm-clear-btn` |
| `.jd-apply-btn` | `.pm-apply-btn` |
| `.jd-empty-warning` | `.pm-empty-warning` |
| `.jd-tag-indicator` | `.pm-tag-indicator` |
| `.jd-header-right` | `.pm-header-right` |
| `.jd-sheet-title` | `.pm-sheet-title` |
| `.jd-sheet-subtitle` | `.pm-sheet-subtitle` |
| `.jd-tag-chips` | `.pm-tag-chips` |

Everyday Life's HTML is updated to use `pm-*` classes. Strange Scenes HTML uses the same `pm-*` classes from the start.

Screen-specific layout overrides (positioning of regen-btn, history-nav, prompt-text) stay scoped to each screen ID (`#screen-just-draw`, `#screen-strange-scenes`) — those are not shared.

---

## Home Screen

Add a "Strange Scenes" button to the `.mode-buttons` group alongside "Everyday Life" and "✦ Surreal Cauldron".

---

## Screen: `screen-strange-scenes`

Structure mirrors `screen-just-draw`, using shared `pm-*` classes:

```
[ ← back ]  [ Strange Scenes ]  [ ⊞ filter ]  [ ⧉ copy ]
<p id="ss-prompt" class="prompt-text"></p>
<p id="ss-tag-indicator" class="pm-tag-indicator"></p>
[ ↺ new prompt ]
[ ‹  ● ● ○  › ]
Prompts inspired by the work of Roland Topor
[ pm-filter-backdrop ][ pm-filter-sheet ]
```

- No locking — prompts are atomic single sentences
- Attribution: "Prompts inspired by the work of Roland Topor"
- Filter sheet title: "Filter by theme" (vs Everyday Life's "Filter by subject")

---

## State

```js
// Everyday Life (existing, kept as-is in shape, values reset on home entry)
const jdConfig = { pool: [], tags: JD_TAGS, deck: [], activeTags: [], tagMode: 'any', ids: { ... } };

// Strange Scenes (new)
const ssConfig = { pool: [], tags: SS_TAGS, deck: [], activeTags: [], tagMode: 'any', ids: { ... } };
```

`store.strangeScenes` holds the loaded `strange_scenes.json` data (same load pattern as `store.justDraw`).

---

## History

History is shared (`promptHistory`, `historyIndex`, `pushToHistory`). Both modes use `renderHistoryWidget` with their own nav element IDs — already parameterized, no change needed.

`navigateHistory` currently hardcodes suffix logic (`'just-draw'` vs `'imagine'`). This is extended to handle `'strange-scenes'` the same way, or refactored to derive suffix from the mode config.

---

## What Is Not Changing

- Surreal Cauldron — untouched
- Shared prompt screen (`screen-imagine-prompt`) — untouched
- Existing data files — untouched (Topor words already added separately)
- Everyday Life behavior — identical after refactor, only internals change
