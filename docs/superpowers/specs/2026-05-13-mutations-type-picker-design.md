---
name: Mutations Type Picker Design Spec
description: Adds a combination-type selection screen between the Mutations button and the prompt display
type: project
date: 2026-05-13
---

# Mutations Type Picker — Design Spec

## Overview

When a user selects "Mutations" from the Imagination Mode Picker, they currently go directly to a prompt. This change inserts a new screen that lets the user choose the combination type — or let the app pick randomly — before seeing the prompt.

## Updated Screen Flow

```
[ Home ]
  "Just draw!" ──────────────────────────────────────────→ [ Just Draw Prompt ]
  "Can you imagine..." ──────────────────────────────────→ [ Mode Picker ]
                              "Surreal Narrative" ─────────→ [ Imagination Prompt ]  ← back → Mode Picker
                              "Mutations" ─────────────────→ [ Mutations Type Picker ]
                                    "Organic + Organic" ───→ [ Imagination Prompt ]  ← back → Mutations Type Picker
                                    "Organic + Synthetic" ─→ [ Imagination Prompt ]  ← back → Mutations Type Picker
                                    "Synthetic + Synthetic"→ [ Imagination Prompt ]  ← back → Mutations Type Picker
                                    "Random" ──────────────→ [ Imagination Prompt ]  ← back → Mutations Type Picker
```

## New Screen: `screen-mutations-type`

- **Back button** → `screen-mode-picker`
- **Heading:** "Mutations"
- **4 buttons** (reuse existing `.mode-btn` style):
  - "Organic + Organic"
  - "Organic + Synthetic"
  - "Synthetic + Synthetic"
  - "Random"
- No new CSS required — all existing classes apply.

## JS Changes

### `generateMutation(type)`

Extend to accept an explicit type parameter:

| `type` value | Behavior |
|---|---|
| `'organic-organic'` | `pick(nounsOrganic) + pick(nounsOrganic)` |
| `'organic-synthetic'` | `pick(nounsOrganic) + pick(nounsSynthetic)` |
| `'synthetic-synthetic'` | `pick(nounsSynthetic) + pick(nounsSynthetic)` |
| `'random'` | Equal 1/3 probability for each of the above |

Output format unchanged: `"noun1 + noun2"`

### State variables

| Variable | Type | Purpose |
|---|---|---|
| `imagineMode` | `'surreal' \| 'mutations' \| null` | Which imagination sub-mode is active (existing) |
| `mutationType` | `'organic-organic' \| 'organic-synthetic' \| 'synthetic-synthetic' \| 'random' \| null` | Which mutation combination type was selected |
| `promptBackTarget` | `string \| null` | Screen ID the Imagination Prompt's back button navigates to |

### Navigation changes

- `btn-mutations` click → `showScreen('screen-mutations-type')` (was: generate prompt + show imagination prompt)
- Each type button click → set `imagineMode = 'mutations'`, set `mutationType`, set `promptBackTarget = 'screen-mutations-type'`, generate prompt, show imagination prompt
- `btn-surreal` click → set `promptBackTarget = 'screen-mode-picker'` (unchanged nav, add back target assignment)
- Imagination Prompt back button → reads `promptBackTarget` dynamically instead of static `data-target`

### Regen button

`btn-regen-imagine` calls `generateMutation(mutationType)` when `imagineMode === 'mutations'`. Existing `generateSurrealNarrative()` path unchanged.

## What Doesn't Change

- No new CSS
- No new data files
- All other screens and flows unchanged
- Output format `"noun1 + noun2"` unchanged
- No category labels shown
