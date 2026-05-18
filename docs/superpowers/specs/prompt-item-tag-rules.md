# Prompt, Item & Tag Rules

_Last updated: 2026-05-15. Supersedes `just_draw_tagging_rules.md`. Referenced by `design.md`._

---

## Overview

All data files in this project share a common tagged format — `{ name, tags[] }` — and a common set of quality rules. This document is the single source of truth for:

- General tag and item quality rules (applies to every data file)
- `just_draw_tagged.json` tag vocabulary and application rules
- Surreal Cauldron tag rules (organic nouns, synthetic nouns, environments)

---

## General Tag Quality Rules

Before committing changes to any tagged data file, run two checks:

1. **Coverage:** every tag must appear on at least 20 items in that file. Tags with fewer than 20 items are too sparse to be useful as filters — a user who selects that tag will see a nearly fixed result every time. If a tag cannot reach 20 items without resorting to variants or obscure entries, it is a signal the tag is too narrow and should not exist. Fold those items into a broader tag instead.
2. **Validity:** every item under a tag must legitimately satisfy the tag's definition — no misclassified entries, no relational tags, no retired tags.

---

## General Item Quality Rules

Every item in any data file must meet three conditions:

1. **Visually distinct within its category.** Each item should look meaningfully different from the other items sharing its tags. An item that looks interchangeable with others in the same pool adds nothing.
2. **Picturable without looking it up.** An artist reading the prompt should be able to form a mental image immediately. Highly technical names, compound descriptors, or terms that require domain expertise to visualize should not be added.
3. **No variants.** Each item must be the canonical base form of a thing — not a named variation of something already in the pool. The test is what an artist would draw: if "bullfrog" produces essentially the same drawing as "frog," it's a variant and should not be added. If the visual result is meaningfully different despite sharing a base type, it may qualify as its own entry.

For **strange_scenes prompts** specifically, two additional failure modes apply — see the Strange Scenes section for the full picturable test.

---

## just_draw Tag Rules

### Data file

`data/just_draw_tagged.json` — prompts for the Everyday Life mode, stored as `{ name, tags[] }` objects.

### Tag model

Tags operate on two tiers:

- **Tier 1 — Primary tags (11):** Abstract awareness, practice, and subject-matter categories. Every prompt should have at least one.
- **Tier 2 — Context tags:** Occasion or setting filters. Optional additions layered on top of primary tags.

### Guiding principle

> **A tag must complete the sentence "this prompt primarily engages ___."** Tags describe what mode of attention, drawing practice, or subject category the prompt activates — not incidental qualities.

### Tier 1 — Primary tags

| Tag | Definition |
|-----|-----------|
| `spatial` | The prompt engages perspective, viewpoint, position in space, or geometry of the environment — looking from an unusual angle, through/under/above something, mapping a space |
| `sensory` | The prompt foregrounds a perceptual quality: color (including named colors), light, shadow, shine, texture, temperature, translucency |
| `temporal` | The prompt is anchored in time: memory, personal history with an object, age or change, before/after, time-of-day, routine |
| `emotional` | The prompt is about internal states, feelings, meaning, or relationships — the subject evokes or represents something felt |
| `craft` | The prompt specifies HOW to draw rather than WHAT — a technique, constraint, style directive, or meta-drawing approach |
| `still_life` | The primary subject is an inanimate everyday object: food, drink, household item, tool, clothing, or accessory |
| `botanical` | The primary subject is a plant, fungus, or plant-derived specimen studied for its form — flowers, leaves, bark, roots, seeds, fruit, vegetables, moss. Applies to both indoor specimens (still-life fruit, cut flowers, herb jars) and field specimens (a pinecone, a single leaf, a patch of bark). Does not apply to processed food where the plant origin is no longer the visual subject (bread, toast, noodles), or to landscapes where plants are incidental to the scene. May co-exist with `still_life` or `nature` depending on context. |
| `urban` | Drawing practice focused on the built environment: streets, architecture, shop fronts, public spaces, city infrastructure — on-location sketching |
| `nature` | Drawing practice focused on the natural world: plants, wildlife, landscapes, weather, natural phenomena — field sketching |
| `figures` | Drawing practice focused on people and the human form: portraits, body parts, self-portraiture, gesture, people in public |
| `imagination` | The prompt has no defined observable subject — the artist must construct the subject entirely from within their own mind |

### Tier 2 — Context tags

Applied in addition to primary tags. Do not use context tags as a substitute for primary tags.

| Tag | When to apply |
|-----|--------------|
| `seasonal` | Prompt is explicitly tied to a season (spring, summer, fall/autumn, winter) |
| `holiday` | Prompt is explicitly tied to a holiday or cultural occasion |

### Application rules

1. A prompt may carry **multiple primary tags**. Apply all that legitimately apply.
2. Tags describe what the prompt **primarily** engages. Do not tag incidental qualities — "Draw a red apple" is `organic`, not `sensory`, because the color is incidental to the subject.
3. Exception to rule 2: when a sensory quality IS the subject of the prompt ("Draw something shiny", "Draw a shadow"), apply `sensory` alongside the subject tag.
4. `craft` applies only when the prompt explicitly constrains the drawing method — not merely because any drawing involves craft. "Draw a dog" is not `craft`. "Draw a dog in the style of an old master" is `craft`.
5. `figures` covers body parts and self-portraiture (hand, eye, foot, self portrait) as well as people in public.
6. `still_life` covers food and drink as a subject category. Prompts where food is the subject get `still_life` regardless of whether they also involve sensory qualities.
7. `botanical` may be added alongside `still_life` when the subject is a plant or plant-derived specimen (a lemon, an apple, an herb jar). It may be added alongside `nature` when the prompt is a close study of a plant in the field (a single leaf, a patch of bark, a pinecone). Do not add `botanical` to prompts where plants are incidental to a broader scene (a landscape, a cityscape with trees).
8. `urban` applies to on-location drawing in cities and built environments. "Draw the front of your house" is `urban`. "Draw your kitchen" is `still_life`, not `urban`.
9. `nature`, `figures`, and `urban` are distinct drawing practices — they co-exist with subject tags. A nature prompt about a leaf is both `nature` and `botanical`.
9. `imagination` applies when the prompt cannot be answered by looking around and choosing something visible. The artist must reach into their mind rather than their surroundings.

### Ambiguous cases

| Prompt type | Rule |
|-------------|------|
| Named color prompts ("Draw something green") | `sensory` — color IS the subject |
| Emotional adjective as subject ("Draw something sad") | `emotional` |
| Body parts ("Draw your hand") | `organic` + `figures` |
| Food/drink items ("Draw a lemon") | `still_life` + `botanical` if the subject is a whole plant-derived specimen (fruit, vegetable, herb); `still_life` only if the plant origin is no longer the visual subject (bread, toast, noodles) |
| Prompts with personal history ("Draw something you cherish") | `temporal` or `emotional` depending on whether time or feeling dominates |
| Prompts with both viewpoint AND subject ("Draw what you see from your kitchen window") | `spatial` + subject tag |
| Technique + subject ("Draw in the style of an old master") | `craft` + subject tag |
| Nature subject + technique ("Fractal Study: draw the skeleton of a leaf first") | `nature` + `craft` |

### Coverage exceptions

The coverage threshold is **20 items per primary tag**. Known exceptions where a tag may sit below 20 and should be grown over time rather than removed:

- `imagination` — a deliberately sparse category; prompts are hard to write without overlapping existing ones
- `botanical` — new tag; currently at 26 items, above threshold, but a smaller pool than most. Grow alongside `nature` and `still_life` additions.

### Items with no primary tag

A small number of prompts resist all classification (~4 currently). These carry an empty `tags` array. Acceptable as long as the count stays at or below 9.

---

## Surreal Cauldron — Organic Noun Tagging Rules

File: `data/nouns_organic_tagged.json`

> **Every tag must complete the sentence "this thing IS ___" on its own.** Tags describe what a noun is — not what it belongs to, where it sits, or what it relates to.

### The four axes

Each entry carries tags drawn from up to four axes. Tags from different axes may be combined freely; tags within the same axis should not conflict.

| Axis | Tags |
|------|------|
| **Identity** | `animal`, `anatomy`, `human`, `monster` |
| **Type** (sub-category of identity) | `mammal`, `bird`, `reptile`, `fish`, `bug`, `aquatic`, `plant`, `fungus`, `microscopic` |
| **Character** | `predator`, `domestic`, `mythic`, `weird` |

Every entry must have at least one identity or type tag.

### Identity rules

- All whole creatures get `animal`. Sub-type tags (`mammal`, `bird`, etc.) narrow that identity but do not replace it.
- `anatomy` entries represent body parts. They use only `anatomy` + character. No relational tags.
- `human` entries are visually striking human archetypes. They use only `human` + character.
- `monster` entries are mythic or fantastical beings. All monsters get `mythic`. Type tags (`aquatic`, `reptile`, `bird`, `mammal`) may be added where they genuinely apply to the creature's form.

### Type rules

- **`mammal`, `bird`, `reptile`** — biological sub-types of animal. `reptile` is used in the colloquial sense — it covers both biological reptiles and amphibians, since most people group frogs, salamanders, snakes, and lizards together naturally.
- **`fish`** — aquatic vertebrates with fins and gills. All fish also get `aquatic`. Excludes aquatic mammals, birds, and reptiles.
- **`bug`** — anything insect-like in the everyday sense: hard-bodied, small, creepy-crawly. Includes true insects, arachnids, centipedes, millipedes. Excludes soft-bodied creatures (snail, slug, worm) which are just `animal`.
- **`arachnid`** — sub-type of `bug` for spiders and scorpions.
- **`aquatic`** — for sea-dwelling creatures with no other type tag (shark, octopus, jellyfish). Also added alongside `mammal` or `reptile` for aquatic variants (whale, turtle).
- **`plant`, `fungus`, `microscopic`** — stand alone as the identity type; no `animal` tag.

---

## Surreal Cauldron — Synthetic Noun Tagging Rules

File: `data/nouns_synthetic_tagged.json`

> **Every tag must complete the sentence "this thing IS ___" on its own.** Tags describe what a noun is — not how it's used, where it sits, or what it relates to.

### The three axes

Each entry carries tags drawn from three axes.

| Axis | Tags |
|------|------|
| **Category** (functional identity) | `clothing`, `container`, `decoration`, `electronic`, `figure`, `furniture`, `instrument`, `kitchen`, `literary`, `structure`, `tool`, `toy`, `trinket`, `vehicle`, `weapon` |
| **Character** (aesthetic or mood quality) | `mundane`, `ornate`, `worn`, `ancient`, `fragile`, `mechanical`, `luminous`, `grotesque`, `uncanny`, `weird`, `fantasy`, `mythic`, `dangerous`, `sharp`, `soft`, `scifi` |

Every entry must have at least one category tag. Character tags are optional additional descriptors — assign only when they genuinely apply.

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

## Surreal Cauldron — Environment Tagging Rules

File: `data/environments_tagged.json`

> **Every tag must complete the sentence "this place IS ___" on its own.** Tags describe the dominant quality of the environment — not what happens there, or what it contains.

### The one axis

Unlike nouns, environments use a single set of descriptive tags. Each entry must have at least one tag; multiple tags are allowed when more than one quality genuinely applies.

| Tag | Definition |
|-----|------------|
| `aerial` | The environment IS elevated — in the air, on a high ledge, above the ground |
| `built` | The environment IS man-made or constructed — a room, a ruin, a structure |
| `cosmic` | The environment IS outer space or an alien world |
| `dry` | The environment IS arid, parched, or volcanic — desert, lava, cracked earth |
| `frozen` | The environment IS frozen — ice, snow, permafrost, blizzard |
| `tranquil` | The environment IS calm and still — a garden, a library, a quiet body of water |
| `underground` | The environment IS below ground — a cave, a tunnel, a catacomb |
| `wet` | The environment IS defined by water — rain, swamp, ocean, flood |

### Combination rules

Tags from this set may be combined freely when both genuinely apply — a frozen underground lake is both `frozen` and `underground`. Avoid tagging `tranquil` alongside environments that are inherently turbulent (storms, eruptions, battles).

---

## Strange Scenes — Tag Rules

File: `data/strange_scenes.json`

Strange scenes items use `text` and `tags[]` (not `name`). The file is organized in two halves by dominant mood. Tagging follows a two-tier structure: one primary mood tag, plus at least one flavor tag.

---

### Mood tiers

Every item must carry **exactly one** primary mood tag.

| Tag | When to apply |
|-----|--------------|
| `dark` | The prompt is unsettling, menacing, grotesque, or politically bleak. The viewer's first response should be unease. |
| `whimsical` | The prompt is playful, warm, or delightfully strange. The viewer's first response should be delight or amusement. |

**An item must not carry both `dark` and `whimsical`.** If a prompt produces both responses in roughly equal measure, ask which comes first — assign that mood and drop the other.

---

### Dark — flavor tags

Applied in addition to `dark`. At least one is required.

| Tag | Definition |
|-----|-----------|
| `grotesque` | Physical distortion of a body, organ, or creature in a disturbing way. Body horror, flesh merged with objects, unnatural anatomy. |
| `dread` | Creeping wrongness or entropy — things that should work, don't; things that should be safe, aren't. The threat is ambient and unlocated. |
| `paranoia` | The sense of being watched, followed, or targeted. Shadows, reflections, and ordinary objects appear to act with intent directed against the subject. |
| `identity` | Self-dissolution, fractured selfhood, or the gap between inner and outer self. Mirrors, shadows, and reflections used as metaphors for selfhood. |
| `domestic` | A household object is the **central subject** of the image. The strangeness attaches directly to something found inside a home. Clothing worn by a person is not domestic. |
| `satire` | The image has a discernible social or political target — a recognizable institution, power structure, or behavior being critiqued. Apply only if you can complete the sentence "this image satirizes ___." If you cannot name a specific target, do not apply `satire`; use `grotesque` or `dread` instead. |

### Dark — activist cluster

`activist` may be added to dark-section items that explicitly engage with resistance to injustice. Always paired with at least one sub-tag:

| Sub-tag | When to apply |
|---------|--------------|
| `defiance` | The image shows resistance or refusal directed at a power structure. |
| `truth` | The image exposes something concealed, suppressed, or falsely presented. |
| `solidarity` | The image shows collective action or people acting together against shared pressure. |
| `ecological` | The image engages with environmental destruction or its consequences. |

---

### Whimsical — flavor tags

Applied in addition to `whimsical`. At least one is required.

| Tag | Definition |
|-----|-----------|
| `childlike` | Centers a child character, child's-eye perspective, or a sensibility of innocent wonder. |
| `folkloric` | Folk-tale or fable register — animals with wisdom or purpose, traditional domestic magic, the world operating by older rules. |
| `absurdist` | Logic that is internally consistent but defies convention, presented deadpan and without apology. |
| `dreamlike` | Soft, poetic, and non-threatening. Imagery that belongs to the half-conscious border of sleep. |
| `mischievous` | Playful subversion, gentle trickery, or a character quietly exploiting a situation for their own amusement. |

### Whimsical — activist cluster

`activist` may be added to whimsical-section items that engage with social or ecological themes in a hopeful or quietly resistant register. Whimsical activist content is warm rather than bleak. Always paired with at least one sub-tag:

| Sub-tag | When to apply |
|---------|--------------|
| `defiance` | Gentle resistance or refusal, often playful rather than confrontational. |
| `truth` | Exposing or naming what is hidden, often through quiet acts of witness. |
| `solidarity` | Collective care, community connection, or acts done for others without expectation. |
| `ecological` | Environmental restoration, protection, or witness. |
| `care` | Tending, maintenance, or quiet acts of love directed at others — neighbors, strangers, the vulnerable. |

### Picturable test

Every strange_scenes prompt must pass two checks before being added or kept:

**1. Visually resolvable.** An artist must be able to form a clear mental image from the prompt alone. If the strangeness is purely verbal or conceptual — a punchline that only works as language, an internal state with no external form, a quality that can't be rendered — the prompt fails.

> ❌ *A philosopher who has forgotten the question but remains delighted by the answer.* — "forgotten the question" and "delighted by the answer" are internal states with no drawable form.
> ✅ *A magician whose only trick is producing one perfect grape from any hat, but does so with enormous gravitas.* — clear scene: magician, hat, grape, serious expression.

**2. Internally consistent.** The impossible premise must hold together. A surreal detail that contradicts or undermines the very premise it builds on fails — even if the premise itself is fine.

> ❌ *A man who collects Tuesdays in labeled jars and stores them in alphabetical order.* — collecting Tuesdays as jars is a valid surreal premise; but all jars would be labeled "Tuesday," making alphabetical order meaningless.
> ✅ *A child carrying a jar of moonlight as though it were perfectly ordinary.* — the premise (moonlight as a physical object) holds throughout; no detail contradicts it.

**Quick test:** read the prompt and ask "what does the artist actually draw?" If the answer requires filling in something undefined, or if a detail makes the image logically impossible to picture, revise or remove.

### Coverage

No formal coverage threshold has been set for strange_scenes tags yet. Target ≥ 20 items per flavor tag before treating a tag as a reliable filter. Tags currently below or near this threshold: `care`, `ecological`. Grow these alongside new items before activating as UI filters.

---

## Validation

### just_draw validation script

`scripts/validate_just_draw.py` — run against `data/just_draw_tagged.json` to check:

- **Schema** — every item is `{ name: string, tags: string[] }`
- **Vocabulary** — all tags are from the approved primary or context tag sets
- **Coverage** — every primary tag appears on ≥ 20 items (known exceptions flagged as warnings, not failures)
- **Duplicates** — no two items share the same name
- **Untagged items** — items with no primary tag are flagged; fails if count exceeds 9
- **Context-only items** — items with only context tags and no primary tag are flagged as errors

Run from the project root:

```bash
python3 scripts/validate_just_draw.py
```

A clean run ends with `✅ PASSED`. Warnings are expected for known coverage exceptions and do not block commits.
