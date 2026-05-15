# just_draw Tagging Rules

_Last updated: 2026-05-15. Companion to design.md._

---

## Overview

`just_draw_tagged.json` stores prompts from the Everyday Life mode as `{ name, tags[] }` objects — the same shape used by all other tagged data files. Tags enable filtering and future features. This document defines the approved tag vocabulary and the rules for applying them.

---

## Tag Model

Tags operate on **two tiers**:

- **Tier 1 — Primary tags (8):** Abstract awareness/type categories. These are the main vocabulary. Every prompt should have at least one.
- **Tier 2 — Context tags:** Occasion or setting filters. Optional additions layered on top of primary tags.

---

## Tier 1 — Primary Tags

### Guiding principle

> **A tag must complete the sentence "this prompt primarily engages ___."** Tags describe what mode of attention or subject category the prompt activates — not incidental qualities.

| Tag | Definition |
|-----|-----------|
| `spatial` | The prompt engages perspective, viewpoint, position in space, or geometry of the environment — looking from an unusual angle, through/under/above something, mapping a space |
| `sensory` | The prompt foregrounds a perceptual quality: color (including named colors), light, shadow, shine, texture, temperature, translucency |
| `temporal` | The prompt is anchored in time: memory, personal history with an object, age or change, before/after, time-of-day, routine |
| `emotional` | The prompt is about internal states, feelings, meaning, or relationships — the subject evokes or represents something felt |
| `craft` | The prompt specifies HOW to draw rather than WHAT — a technique, constraint, style directive, or meta-drawing approach |
| `organic` | The primary subject is a living thing: animal, plant, person, body part, or natural phenomenon |
| `still_life` | The primary subject is an inanimate everyday object: food, drink, household item, tool, clothing, or accessory |
| `urban` | The primary subject is the urban or built environment: streets, buildings, shop fronts, public spaces, city infrastructure |

### Rules

1. A prompt may carry **multiple primary tags**. Apply all that legitimately apply.
2. Tags describe what the prompt **primarily** engages. Do not tag incidental qualities — "Draw a red apple" is `organic`, not `sensory`, because the color is incidental to the subject.
3. Exception to rule 2: when a sensory quality IS the subject of the prompt ("Draw something shiny", "Draw a shadow"), apply `sensory` alongside the subject tag.
4. `craft` applies only when the prompt explicitly constrains the drawing method — not merely because any drawing involves craft. "Draw a dog" is not `craft`. "Draw a dog in the style of an old master" is `craft`.
5. `organic` covers body parts and self-portraiture (hand, eye, foot, self portrait).
6. `still_life` covers food and drink as a subject category. Prompts where food is the subject get `still_life` regardless of whether they also involve sensory qualities.
7. `urban` applies to on-location drawing in cities and built environments. "Draw the front of your house" is `urban`. "Draw your kitchen" is `still_life`, not `urban`.

### Ambiguous cases

| Prompt type | Rule |
|-------------|------|
| Named color prompts ("Draw something green") | `sensory` — color IS the subject |
| Emotional adjective as subject ("Draw something sad") | `emotional` |
| Body parts ("Draw your hand") | `organic` |
| Food/drink items ("Draw a lemon") | `still_life` |
| Prompts with personal history ("Draw something you cherish") | `temporal` or `emotional` depending on whether time or feeling dominates |
| Prompts with both viewpoint AND subject ("Draw what you see from your kitchen window") | `spatial` + subject tag |
| Technique + subject ("Draw in the style of an old master") | `craft` + subject tag |

---

## Tier 2 — Context Tags

Applied in addition to primary tags. Do not use context tags as a substitute for primary tags.

| Tag | When to apply |
|-----|--------------|
| `seasonal` | Prompt is explicitly tied to a season (spring, summer, fall/autumn, winter) |
| `holiday` | Prompt is explicitly tied to a holiday or cultural occasion |

---

## Coverage Rule (adapted from design.md)

Every primary tag must appear on at least **20 prompts** in `just_draw_tagged.json`.

**Known exceptions at initial tagging:**
- `craft` — expected to be below 20 with the current prompt set (~8 items). Flag in validation but do not fail; new prompts should be written to bring it up.
- `urban` — expected ~14 items at initial tagging. New urban prompts are planned. Flag in validation but do not fail.

---

## Validity Rule (adapted from design.md)

Every item tagged with a given tag must legitimately satisfy "this prompt primarily engages [tag]." No misclassified entries.

---

## Items with No Primary Tag

Some prompts in `just_draw_tagged.json` resist classification. These are acceptable as long as they are few (~9 expected). Examples:
- "Free choice – draw anything you like"
- "Draw something super"
- "Draw something that starts with the first letter of your name"
- "Illustrate a line from a song"

These carry an empty `tags` array. Flag in validation output but do not fail the build.
