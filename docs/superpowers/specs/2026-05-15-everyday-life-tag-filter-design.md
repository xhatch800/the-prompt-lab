# Everyday Life — Tag Filter Design

_IDEA-007 | 2026-05-15_

---

## Overview

Allow users to narrow Everyday Life prompts by subject tags. Filtering is optional and resets on every visit. The prompt screen is the entry point — no configure-first screen.

---

## 1. Data & Tag Vocabulary

- Switch data source from `just_draw.json` to `just_draw_tagged.json`
- Perform a one-time cleanup: strip `holiday` and `seasonal` from all tag arrays in `just_draw_tagged.json` (the prompts themselves remain)
- `store.justDraw` holds the full array of `{ name: string, tags: string[] }` objects
- 11 tags exposed in the filter UI: `still_life`, `organic`, `sensory`, `emotional`, `spatial`, `temporal`, `urban`, `craft`, `nature`, `figures`, `imagination`
- Prompts with an empty `tags: []` are always included regardless of filter state

---

## 2. Filter State & Deck Behavior

Two new state variables, both reset each time the user enters Everyday Life from Home:

| Variable | Type | Default | Reset on |
|---|---|---|---|
| `justDrawActiveTags` | `string[]` | `[]` | Entry from Home |
| `justDrawTagMode` | `'any' \| 'all'` | `'any'` | Entry from Home |

Pool selection logic in `generateJustDraw()`:

- `justDrawActiveTags` is empty → draw from the full pool (all prompts)
- `justDrawActiveTags` non-empty + `any` → prompts where at least one tag matches (union)
- `justDrawActiveTags` non-empty + `all` → prompts where every selected tag matches (intersection)

The existing `filterByTags(pool, tags, tagMode)` function is reused as-is.

The shuffle deck (`justDrawDeck`) resets whenever `justDrawActiveTags` or `justDrawTagMode` changes, preserving the no-repeat guarantee within the filtered pool.

---

## 3. Prompt Screen Layout

Fixed bottom stack — element heights are reserved regardless of filter state so nothing jumps during regen:

```
[ prompt text — fills remaining space ]
─────────────────────── fixed bottom stack ───
[ lock hint ]          always visible
[ tag indicator ]      invisible when no filter active (visibility: hidden)
[ history nav ]        invisible when no history (visibility: hidden)
[ ↺ new prompt ]       always visible
```

**Tag indicator (Variant B — compact text):**
- No filter: `visibility: hidden` (height reserved)
- Filter active: `any: sensory, urban` or `all: spatial, urban, sensory`
- Font size 1.1rem, rust color (#b85c38) at 75% opacity

**Filter button** (`⊞ filter`) sits in the header row (right side). It highlights (filled rust background) when any tags are active.

---

## 4. Filter Sheet

A bottom sheet overlaid on `screen-just-draw`, opened by tapping `⊞ filter`.

**Contents (top to bottom):**
1. Title: "Filter by subject"
2. Subtitle: "All prompts shown when nothing selected"
3. Tag chip grid — 11 chips, toggleable
4. Any/All toggle — appears only when ≥1 chip is selected; matches Cauldron styling
5. Pool count — live count shown alongside any/all toggle (e.g. `121 prompts`)
6. Action row: `clear` button + `↺ new prompt` button

**Interactions:**
- Tapping a chip: toggles it; recalculates pool count live
- Any/all toggle: switches mode; recalculates pool count live
- `↺ new prompt`: closes sheet, resets shuffle deck, generates from filtered pool
- `clear`: deselects all tags, hides any/all toggle and pool count
- Tapping backdrop (dimmed area above sheet): closes sheet without changing active filter

**Edge case — empty pool:** If selected tags + "all" mode yield 0 prompts, the `↺ new prompt` button in the sheet is disabled and a note reads: `"no prompts match — try 'any' or fewer tags"`. The prompt screen continues showing the last valid prompt.

---

## 5. Architecture

- **Data load:** fetch `just_draw_tagged.json` instead of `just_draw.json`; shape is `{ name, tags[] }[]`
- **Filtering:** reuse existing `filterByTags(pool, tags, tagMode)` — no changes needed
- **State:** add `justDrawActiveTags` and `justDrawTagMode` alongside existing `justDrawDeck`; reset all three on entry from Home
- **`generateJustDraw()`:** apply `filterByTags` before passing pool to `drawFromDeck`
- **New HTML:** `#jd-filter-sheet` element inside `screen-just-draw`; styled to match Cauldron config sheet
- **History, lock, animation:** untouched
