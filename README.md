# Drawing Prompt Lab

A mobile-first web app that generates drawing prompts. Two modes: a curated everyday list and a custom prompt builder.

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

- Tap **↺ new prompt** to get the next prompt
- Use **‹ ›** to browse your prompt history — previous prompts stay intact
- Tap **⧉** (top-right) to copy the current prompt to your clipboard
- Attribution links back to [Danny Gregory's site](https://dannygregorysblog.com/community/edm-challenges/)

### Surreal Cauldron

Build your own prompt by combining components with optional tag filters.

**Components**

| Component | Description |
|-----------|-------------|
| Adjective | Randomly drawn from the full adjective list (untagged) |
| Noun | An organic or synthetic object — filter by tag to narrow the pool |
| Verb | An action or state — filter by tag |
| Environment | A setting — filter by tag |

You can add multiple Noun components to create stranger combinations.

**Tag filtering**

Each tagged component shows a **+ tag** button. Tap it to open the tag picker and select one or more tags. Toggle **ANY / ALL** to control whether prompts must match any selected tag (union) or all of them (intersection).

- A match count badge appears when tags are active — green outline if matches exist, red filled if zero matches
- The **Generate** button is disabled if any component has zero matches

**Locking words**

After generating a prompt, tap any word to lock it in place. Locked words are highlighted in orange. Tap **↺ new prompt** and only the unlocked words regenerate — useful for keeping a good noun while cycling through environments.

**Presets**

Two starting configurations are available at the top of the config screen:

- **Surreal Narrative** — Adjective + Noun + Verb + Environment
- **Strange Combinations** — Noun + Noun

---

## History

Both modes keep a history of generated prompts. Use **‹ ›** to navigate. Tapping **↺ new prompt** always appends to the end of history — browsing back and regenning does not erase prompts you've already seen.

---

## Data files

Prompt data lives in `data/`:

| File | Contents |
|------|----------|
| `just_draw.json` | Everyday Life prompt list |
| `adjectives.json` | Adjective pool |
| `nouns_organic_tagged.json` | Organic nouns with tags |
| `nouns_synthetic_tagged.json` | Synthetic nouns with tags |
| `verbs_tagged.json` | Verbs with tags |
| `environments_tagged.json` | Environments with tags |

Each tagged file contains objects with a `name` field and a `tags` array. Adjectives are a plain array of strings.
