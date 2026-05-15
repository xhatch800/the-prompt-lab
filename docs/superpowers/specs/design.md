# Drawing Prompt Lab — Design Spec

_Last updated: 2026-05-14. Supersedes all earlier spec files._

---

## Overview

Drawing Prompt Lab is a static single-page web app that gives artists on-demand drawing prompts. Two modes: curated everyday prompts (Everyday Life) and a custom prompt builder (Surreal Cauldron). Hosted on GitHub Pages, built with vanilla JS/CSS, no dependencies.

---

## Screen flow

```
[ Home ]
  Everyday Life   ──→ [ Everyday Life prompt ]
  Surreal Cauldron ──→ [ Cauldron config ] ──→ [ Prompt screen ]
                                 ↑                      |
                                 └──── ← back ──────────┘
```

All screens fade in/out via CSS opacity transitions (~200ms). A single `showScreen(id)` function manages transitions. All non-home screens have a ← back button.

---

## Visual design

- **Background:** `#fdf8f0` (cream)
- **Font:** Caveat (Google Fonts) for all headings and buttons; sans-serif for small labels and tags
- **Accent:** `#b85c38` (burnt orange) — outlines, text, active states
- **Button style (universal):** cream fill `#fdf8f0`, orange `#b85c38` border + text, 3px offset box-shadow. Hover shifts by 2px. Disabled: `opacity: 0.35`.
- **Prompt text:** Caveat, large (3.5rem portrait), centered, white against dimmed wallpaper
- **Wallpaper:** Scattered hand-drawn SVG doodles behind all screens. Dimmed to `opacity: 0.05` on prompt screens, `opacity: 0.22` elsewhere.
- **Mobile-first:** Buttons sized for thumb reach. Landscape breakpoints adjust font sizes and bottom spacing.

---

## Home screen

Two buttons rendered in `.mode-buttons`:

1. **Everyday Life**
2. **✦ Surreal Cauldron**

Both start disabled on page load, enabled once data loads successfully. If data fails to load an error banner is shown and both remain disabled.

---

## Everyday Life

Prompts drawn from Danny Gregory's Everyday Drawing Challenges list (`data/just_draw.json`).

**Screen elements:**
- ← back (top-left) → Home
- Screen label: "Everyday Life"
- ⧉ copy button (top-right) — copies current prompt to clipboard; shows ✓ for 1.5s
- Prompt text — full-screen centred, Caveat font
- ↺ new prompt button (bottom)
- History nav: ‹ dots › (above regen)
- Attribution: "Prompt list by Danny Gregory" (fixed at bottom, links to his site)

**Prompt generation:** random pick from `just_draw.json`. Each regen appends to history regardless of current position in history.

---

## Surreal Cauldron

### Config screen

**Preset strip** (top of screen):

| Preset | Default slots |
|--------|--------------|
| Surreal Narrative | Adjective + Noun + Verb + Environment |
| Strange Combinations | Noun + Noun |

Tapping a preset re-initialises all slots to that preset's defaults.

**Component rows** (canonical order: Adjective → Nouns → Verb → Environment):

- **Adjective** — untagged, fully random. Toggle on/off only.
- **Noun** — pool selector (Organic / Either / Synthetic) + tag picker. Multiple nouns allowed (up to 4). noun_1 cannot be removed; noun_2+ have a remove link.
- **Verb** — tag picker + toggle.
- **Environment** — tag picker + toggle.

In Surreal Narrative preset: `+ add another Noun` and `+ add component` (reveals tray of inactive components). In Strange Combinations preset: `+ add another Noun` only.

**Tag filtering:**

- `+ tag ▾` button expands an inline tag picker panel below that row
- Tags shown alphabetically; tapping toggles selection
- When ≥1 tag selected, ANY/ALL toggle appears
  - **ANY** (default): items matching at least one tag (union)
  - **ALL**: items matching every tag (intersection)
- Selected tags shown as chips with ×; tapping × removes the tag

**Match count badge:** visible when tags are active on a component.
- >0 matches → orange outline pill
- 0 matches → red filled pill

**Generate button:** disabled if no slots are active or any active tagged component has 0 matches. When tapped: generates prompt, navigates to prompt screen.

**Scrolling:** config screen scrolls vertically when content overflows.

### Generation logic

`generateCauldron(config, current, locked)`:
- Skips locked slots (preserves previous value)
- Adjective: random pick from `store.adjectives`
- Noun: pick from pool (organic/synthetic/either), filtered by tags; fallback to full pool if 0 matches
- Verb/Environment: pick from full tagged pool filtered by tags; fallback to full pool if 0 matches
- Duplicate noun prevention: tracks used names per pool, re-picks if collision

`filterByTags(pool, tags, tagMode)`:
- Empty tags → return full pool
- `any`: items where at least one tag matches
- `all`: items where all tags match

### Prompt screen

Reuses `screen-imagine-prompt` with `imagineMode = 'cauldron'`.

**Screen elements:**
- ← back (top-left) → Cauldron config
- Screen label: "Surreal Cauldron"
- ⧉ copy button (top-right)
- Prompt text — word spans, each tappable
- Lock hint: "tap a word to lock it" (fades after first lock)
- ↺ new prompt button
- History nav: ‹ dots ›

**Word locking:** tapping a word toggles its locked state. Locked words are highlighted orange and excluded from the next regen. `lockedSlots` object keyed by slot id.

**Shuffle animation:** on regen, unlocked slots cycle rapidly through random values, decelerating to a final settle (slot-machine effect). Locked slots remain static.

**History:** each regen appends to the end of the history array regardless of current position. Max 20 entries. Cleared on entering the prompt screen fresh from config.

---

## Data files

All files loaded in parallel on page init via `Promise.all`. Held in JS `store` object for the session.

| File | Shape | Used by |
|------|-------|---------|
| `data/just_draw.json` | `string[]` | Everyday Life |
| `data/adjectives.json` | `string[]` | Surreal Cauldron — Adjective slot |
| `data/nouns_organic_tagged.json` | `[{name, tags}]` | Surreal Cauldron — Noun slot (organic pool) |
| `data/nouns_synthetic_tagged.json` | `[{name, tags}]` | Surreal Cauldron — Noun slot (synthetic pool) |
| `data/verbs_tagged.json` | `[{name, tags}]` | Surreal Cauldron — Verb slot |
| `data/environments_tagged.json` | `[{name, tags}]` | Surreal Cauldron — Environment slot |

Unique sorted tag arrays are extracted from each tagged file at load time and stored as `store.nounsOrganicTags`, `store.nounsSyntheticTags`, `store.verbsTags`, `store.environmentsTags`.

---

## Tag and Item Model

Tags in the Surreal Cauldron serve two purposes: they power the tag picker UI (users filter a component pool by selecting tags) and they ensure generated prompts feel intentional rather than random. Good tags give users meaningful handles on the pool — "give me something aquatic" or "give me something mythic" — and good items make the output immediately picturable.

> **Full tag and item quality rules — including just_draw tagging rules, organic/synthetic/environment rules, and validation guidance — are defined in [`prompt-item-tag-rules.md`](prompt-item-tag-rules.md).**


---

## Architecture

- Single `index.html` — all HTML, embedded CSS, embedded JS
- No frameworks, no build step
- `fetch` requires a local HTTP server for dev (`python3 -m http.server 8080`)
- No localStorage — state is session-only
- GitHub Pages compatible (static hosting)

### Key state variables

| Variable | Purpose |
|----------|---------|
| `currentScreen` | ID of the currently visible screen |
| `imagineMode` | `'cauldron'` — prompt screen mode |
| `promptBackTarget` | Screen to return to from prompt screen |
| `cauldronConfig` | Current cauldron slot config (`{preset, slots[]}`) |
| `currentPrompt` | Current generated prompt object (keyed by slot id) |
| `lockedSlots` | Object of locked slot ids |
| `promptHistory` | Array of prompt objects/strings for the session |
| `historyIndex` | Current position in history |

### Key functions

| Function | Purpose |
|----------|---------|
| `showScreen(id)` | Fade transition between screens |
| `initCauldronConfig(preset)` | Reset cauldronConfig to preset defaults |
| `renderCauldronConfig()` | Re-render entire config screen from state |
| `generateCauldron(config, current, locked)` | Generate prompt from cauldron config |
| `filterByTags(pool, tags, tagMode)` | Filter tagged pool by selected tags |
| `renderPrompt(container, mode)` | Render prompt word spans into prompt screen |
| `pushToHistory(prompt)` | Append to history, advance index |
| `navigateHistory(direction, containerId, mode)` | Move through history |
