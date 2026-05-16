# Strange Scenes — Design Spec

**Date:** 2026-05-16
**Feature:** IDEA-008 — Integrate Topor full prompts into the app as a new "Strange Scenes" mode

---

## Summary

Add a "Strange Scenes" mode to the home screen. It draws randomly from ~50 curated Roland Topor-inspired full prompts, with tag-based filtering. The experience mirrors "Everyday Life" exactly: its own dedicated screen, filter sheet, regen, history, and copy — no component locking (prompts are atomic).

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

**Tag vocabulary** (thematic, not exhaustive per prompt):

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

## Home Screen

Add a "Strange Scenes" button to the `.mode-buttons` group on the home screen, alongside "Everyday Life" and "✦ Surreal Cauldron".

---

## Screen: `screen-strange-scenes`

Mirrors `screen-just-draw` in structure:

```
[ ← back ]  [ Strange Scenes ]  [ ⊞ filter ]  [ ⧉ copy ]
<p id="ss-prompt" class="prompt-text"></p>
<p id="ss-tag-indicator" class="ss-tag-indicator"></p>
[ ↺ new prompt ]
[ ‹  ● ● ○  › ]   (history nav)
Prompts inspired by the work of Roland Topor
[ filter backdrop + filter sheet ]
```

- **No locking** — prompts are atomic single sentences; no slot lock controls
- **Filter sheet** — same chip + any/all + pool count + apply pattern as Everyday Life, using the 6 Topor tags
- **History** — reuses existing history nav pattern; keyed to `'strange-scenes'` mode
- **Attribution** — "Prompts inspired by the work of Roland Topor"

---

## Mode Identifier

Internal mode string: `'strange-scenes'`

Used in `imagineMode` state, `renderPrompt()` branch, `animateUnlockedSlots()` branch, history keying, and filter state.

---

## Generate Function: `generateStrangeScenes()`

Mirrors `generateJustDraw()` in structure:

1. Filter `strangeScenes` pool by selected tags (any/all mode)
2. Draw one prompt using the existing `drawFromDeck` no-repeat pattern, keyed to a `scenesDecks` deck
3. Return the prompt text

No sub-slots. The returned value is a plain string rendered into `#ss-prompt`.

---

## Filter State

Separate from the Everyday Life filter state. New variables:

- `ssActiveTags` — set of active tag strings (default: all off = no filter)
- `ssAnyAll` — `'any'` or `'all'` (default: `'any'`)

Filter applies on "Apply" tap, same as Everyday Life.

---

## What Is Not Changing

- Surreal Cauldron — untouched
- Everyday Life — untouched
- Shared prompt screen (`screen-imagine-prompt`) — untouched
- Existing data files — untouched (Topor words already added separately)
