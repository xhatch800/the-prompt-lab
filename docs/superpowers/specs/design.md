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

### Tag quality rules

Before committing changes to any tagged data file, run two checks:

1. **Coverage:** every tag must appear on at least 20 items in that file. Tags with fewer than 20 items are too sparse to be useful as filters in the Cauldron — a user who selects that tag will see a nearly fixed result every time. If a tag cannot reach 20 items without resorting to variants or obscure entries, it is a signal the tag is too narrow and should not exist. Fold those items into a broader tag instead.
2. **Validity:** every item under a tag must legitimately satisfy "this thing IS [tag]" — no misclassified entries, no relational tags, no retired tags.

Both checks apply to all tagged files (`nouns_organic_tagged.json`, `nouns_synthetic_tagged.json`, `verbs_tagged.json`, `environments_tagged.json`).

### Item quality rules

Every item in any data file must meet three conditions:

1. **Visually distinct within its category.** Each item should look meaningfully different from the other items sharing its tags. An item that looks interchangeable with others in the same pool adds nothing. A hydra belongs in `microscopic` because it looks nothing like a paramecium or a spirochete — it earns its place.
2. **Picturable without looking it up.** An artist reading the prompt should be able to form a mental image immediately. Highly technical names, compound descriptors, or terms that require domain expertise to visualize should not be added.
3. **No variants.** Each item must be the canonical base form of a thing — not a named variation of something already in the pool. The test is what an artist would draw: if "bullfrog" produces essentially the same drawing as "frog," it's a variant and should not be added. If the visual result is meaningfully different despite sharing a base type, it may qualify as its own entry.

---

## Organic noun tagging rules

Tags in `nouns_organic_tagged.json` follow a single guiding principle:

> **Every tag must complete the sentence "this thing IS ___" on its own.** Tags describe what a noun is — not what it belongs to, where it sits, or what it relates to.

### The four axes

Each entry carries tags drawn from up to four axes. Tags from different axes may be combined freely; tags within the same axis should not conflict.

| Axis | Tags |
|------|------|
| **Identity** | `animal`, `anatomy` |
| **Type** (sub-category of identity) | `mammal`, `bird`, `reptile`, `amphibian`, `bug`, `arachnid`, `aquatic`, `plant`, `fungus`, `microscopic` |
| **Character** | `predator`, `domestic`, `mythic`, `weird` |
| **Size** | `tiny`, `small`, `medium`, `large`, `enormous` |

Every entry must have at least one identity or type tag, and exactly one size tag.

### Identity rules

- All whole creatures get `animal`. Sub-type tags (`mammal`, `bird`, etc.) narrow that identity but do not replace it.
- `anatomy` entries represent body parts. They use only `anatomy` + size + character. No relational tags.

### Type rules

- **`mammal`, `bird`, `reptile`** — biological sub-types of animal. `reptile` is used in the colloquial sense — it covers both biological reptiles and amphibians, since most people group frogs, salamanders, snakes, and lizards together naturally.
- **`bug`** — anything insect-like in the everyday sense: hard-bodied, small, creepy-crawly. Includes true insects, arachnids, centipedes, millipedes. Excludes soft-bodied creatures (snail, slug, worm) which are just `animal`.
- **`arachnid`** — sub-type of `bug` for spiders and scorpions.
- **`aquatic`** — for sea-dwelling creatures with no other type tag (shark, octopus, jellyfish). Also added alongside `mammal` or `reptile` for aquatic variants (whale, turtle).
- **`plant`, `fungus`, `microscopic`** — stand alone as the identity type; no `animal` tag.

---

## Synthetic noun tagging rules

Tags in `nouns_synthetic_tagged.json` follow the same guiding principle as organic nouns:

> **Every tag must complete the sentence "this thing IS ___" on its own.** Tags describe what a noun is — not how it's used, where it sits, or what it relates to.

### The three axes

Each entry carries tags drawn from three axes.

| Axis | Tags |
|------|------|
| **Category** (functional identity) | `clothing`, `container`, `decoration`, `electronic`, `figure`, `furniture`, `instrument`, `kitchen`, `literary`, `structure`, `tool`, `toy`, `trinket`, `vehicle`, `weapon` |
| **Character** (aesthetic or mood quality) | `mundane`, `ornate`, `worn`, `ancient`, `fragile`, `mechanical`, `luminous`, `grotesque`, `uncanny`, `weird`, `fantasy`, `mythic`, `dangerous`, `sharp`, `soft`, `scifi` |
| **Size** | `tiny`, `small`, `medium`, `large`, `enormous` |

Every entry must have at least one category tag and exactly one size tag. Character tags are optional additional descriptors — assign only when they genuinely apply.

### Category definitions

- **`clothing`** — garments and wearable items: coat, boot, apron, cape, armor, crown.
- **`container`** — objects whose primary function is to hold things: bottle, barrel, box, bag, birdcage, cauldron.
- **`decoration`** — objects that exist primarily to be displayed or admired: chandelier, tapestry, banner, trophy, dreamcatcher, ornament.
- **`electronic`** — objects powered by electricity or containing electronics: battery, circuit board, camera, computer, radio, television.
- **`figure`** — objects shaped like or representing a person or creature: doll, mannequin, statue, bust, effigy, marionette, scarecrow, gargoyle.
- **`furniture`** — objects that furnish a room or domestic space: chair, bed, bookshelf, clock, mirror, chandelier.
- **`instrument`** — devices used to measure, play, or detect: compass, barometer, metronome, gramophone, abacus, sextant.
- **`kitchen`** — objects associated with food preparation or eating: bowl, cup, colander, pot, mortar, whisk.
- **`literary`** — objects associated with writing, recording, or transmitting knowledge: book, quill, inkwell, journal, scroll, typewriter, cipher.
- **`structure`** — built or architectural forms: bridge, arch, tower, barn, aqueduct, pagoda, pyramid, ferris wheel.
- **`tool`** — objects used to perform work or enable a function: hammer, wrench, gear, engine, pump, bellows, pulley.
- **`toy`** — objects made for play or amusement: kite, spinning top, yo-yo, kaleidoscope, puppet, jack-in-the-box.
- **`trinket`** — small objects carried or kept for sentimental, symbolic, or decorative value: pocket watch, locket, amulet, button, dice, badge.
- **`vehicle`** — objects that transport: boat, bicycle, carriage, balloon, airplane, submarine.
- **`weapon`** — objects designed to cause harm: sword, bow, cannon, crossbow, dagger, trident.

### Character tag rules

Character tags layer additional qualities onto a categorized item. The IS test still applies — only add a character tag if the item genuinely IS that thing, not merely associated with it.

- **`mechanical`** — the item IS a mechanical device or component (gears, engines, automata). Not for objects that merely contain mechanical parts.
- **`ancient`** — the item evokes antiquity in form or material; it would not look out of place in a pre-industrial world.
- **`mythic`** — the item belongs to myth, legend, or fairy tale — it carries symbolic weight beyond its function.
- **`fantasy`** — the item is fantastical or magical in nature; it could not exist in the real world.
- **`scifi`** — the item belongs to a science-fiction setting.
- **`ornate`** — the item IS elaborately decorated or highly crafted in appearance: chandelier, tapestry, armor, crown, cameo.
- **`mundane`** — the item is ordinary and everyday, unremarkable in appearance.
- **`worn`** — the item shows visible signs of age, heavy use, or damage.
- **`fragile`** — the item is visually delicate and easily broken.
- **`luminous`** — the item produces or radiates light.
- **`dangerous`** — the item IS inherently hazardous (fire, sharp edges, explosive force).
- **`sharp`** — the item has a visually prominent pointed or bladed form.
- **`soft`** — the item is made of fabric, textile, or other pliable material.
- **`grotesque`** — the item is disturbing, morbid, or unsettling in appearance.
- **`uncanny`** — the item produces a sense of eerie strangeness or wrongness.
- **`weird`** — the item is bizarre or hard to categorize; it defies easy classification.

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
