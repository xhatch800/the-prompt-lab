---
name: Drawing Prompt Lab Design Spec
description: Full design spec for Drawing Prompt Lab drawing inspiration web app
type: project
date: 2026-05-12
---

# Drawing Prompt Lab — Design Spec

## Overview

Drawing Prompt Lab is a static single-page web app that gives artists on-demand drawing prompts. Two modes: grounded observation ("Just draw!") and imaginative combination ("Can you imagine..."). Hosted on GitHub Pages, built with vanilla JS/CSS, no dependencies.

## Screen Flow

Four screens, one visible at a time, with CSS fade transitions (~200ms, opacity + pointer-events).

```
[ Home ]
  "Just draw!" ──────────────────→ [ Just Draw Prompt ]
  "Can you imagine..." ──────────→ [ Imagination Mode Picker ]
                                        "Surreal Narrative" ──→ [ Imagination Prompt ]
                                        "Mutations" ───────────→ [ Imagination Prompt ]
```

Navigation rules:
- All non-home screens have a ← back button
- "Just Draw Prompt" back → Home
- Imagination Prompt back → Imagination Mode Picker
- All prompt screens have a ↺ regenerate button (new prompt, same screen)
- Mode selection is a landing screen choice, not persistent tabs

## Visual Design

- **Aesthetic:** Light sketchbook — handmade feel via font and spacing, no images/textures
- **Background:** `#fdf8f0` (cream/off-white)
- **Font:** Caveat (Google Fonts) — all text
- **Text:** `#2c2c2c` (ink dark)
- **Buttons:** Rounded rectangles, subtle offset box-shadow for hand-drawn border feel
- **Accent:** `#b85c38` (muted warm) — regenerate button and active states
- **Prompt text:** Large, centered, generous line-height; ~1.8–2.2rem on mobile
- **Mobile-first:** Buttons sized for thumb reach

## Architecture

### File structure

```
index.html          # All HTML, embedded CSS, embedded JS
data/
  just_draw.json        # 328 prompts from Everyday Matters list
  adjectives.json       # ~50–100 adjectives
  nouns_organic.json    # ~50–100 organic nouns (creatures, plants, people)
  nouns_synthetic.json  # ~50–100 synthetic nouns (tools, objects, structures)
  verbs.json            # ~50–100 gerunds (e.g. "gardening")
  environments.json     # ~50–100 settings/conditions
```

### Screen management

All four screens exist as `<div>` elements in the DOM. A single `showScreen(id)` function handles transitions: fade out current → fade in next. Active screen tracked in a JS variable.

### Data loading

All six JSON files fetched in parallel via `Promise.all` on page init. Data held in JS variables for the session. On any fetch failure or empty array: disable mode buttons, show error banner on Home — *"Couldn't load prompt data — try refreshing."*

### Prompt generation

| Mode | Logic |
|---|---|
| Just Draw | Random item from `just_draw.json` |
| Surreal Narrative | One random adjective + one noun (organic or synthetic, chosen at random) + one verb + one environment. Displayed as: `"[adj] [noun] [verb] [environment]"` |
| Mutations | Random combination type (organic+organic, organic+synthetic, or synthetic+synthetic). Pick one item from each relevant noun list. Displayed as: `"[noun1] + [noun2]"` — no category label shown |

### State

- Selected mode and sub-mode stored in JS variables
- No localStorage, no cross-session persistence

## Technical Constraints

- Vanilla JS and CSS only — no libraries, no frameworks, no build step
- Single `index.html` with embedded CSS and JS
- Static GitHub Pages hosting
- `fetch` API requires a local server for dev (e.g. `python3 -m http.server`)
