# Drawing Prompt Lab

A mobile-first web app that generates drawing prompts. Two modes: curated everyday prompts and a custom prompt builder.

## Running the app

Serve the project root with any static file server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

---

## Modes

### Everyday Life

Prompts drawn from Danny Gregory's Everyday Drawing Challenges list.

- Tap **↺ new prompt** to get a new prompt
- Use **‹ ›** to browse prompt history — navigating back and regenning never erases earlier prompts
- Tap **⧉** (top-right) to copy the current prompt to clipboard

### Surreal Cauldron

Build a custom prompt by assembling components. Tap **✦ Surreal Cauldron** from the home screen to open the config.

**Presets**

Choose a starting configuration at the top of the config screen:

- **Surreal Narrative** — Adjective + Noun + Verb + Environment
- **Strange Combinations** — Noun + Noun

You can add, remove, enable, or disable individual components after selecting a preset.

**Components**

| Component | Pool | Taggable |
|-----------|------|----------|
| Adjective | Full adjective list | No — always fully random |
| Noun | Organic, Synthetic, or Either | Yes |
| Verb | Full verb list | Yes |
| Environment | Full environment list | Yes |

You can add multiple Noun components to create unusual pairings.

**Tag filtering**

Tap **+ tag** on any taggable component to filter its pool by topic. Toggle **ANY / ALL** to match prompts that include any selected tag (union) or all of them (intersection).

- A badge shows the number of matching prompts when tags are active
- The badge turns red if a component has zero matches
- **Generate** is disabled until all components have at least one match

**Generating and locking**

Tap **Generate ↓** to produce a prompt. On the prompt screen:

- Tap any **word** to lock it — locked words are highlighted and stay fixed on the next regen
- Tap **↺ new prompt** to regenerate only the unlocked words
- Use **‹ ›** to browse prompt history
- Tap **⧉** (top-right) to copy the prompt to clipboard

---

## Data files

Prompt data lives in `data/`:

| File | Contents |
|------|----------|
| `just_draw.json` | Everyday Life prompt list |
| `adjectives.json` | Adjective pool (plain string array) |
| `nouns_organic_tagged.json` | Organic nouns with tags |
| `nouns_synthetic_tagged.json` | Synthetic nouns with tags |
| `verbs_tagged.json` | Verbs with tags |
| `environments_tagged.json` | Environments with tags |

Tagged files contain objects with a `name` string and a `tags` string array.
