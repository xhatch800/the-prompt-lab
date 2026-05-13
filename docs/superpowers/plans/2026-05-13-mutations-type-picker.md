# Mutations Type Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Mutations Type Picker screen between the "Mutations" button and the prompt display, letting users choose organic+organic, organic+synthetic, synthetic+synthetic, or random.

**Architecture:** All changes are in a single `index.html`. One new screen div is inserted. JS changes update `generateMutation` to accept a type, add two state variables (`mutationType`, `promptBackTarget`), rewire three button handlers, add four new type-button handlers, and make the Imagination Prompt back button dynamic.

**Tech Stack:** Vanilla HTML/CSS/JS, no dependencies, no build step.

---

## File Map

| File | Action |
|---|---|
| `index.html` | Modify — add screen div + update JS |

---

### Task 1: Add `screen-mutations-type` HTML

**Files:**
- Modify: `index.html` (HTML section, after `screen-mode-picker` div, before `screen-just-draw` div — currently around line 184)

- [ ] **Step 1: Insert the new screen div**

Find this comment in `index.html`:
```html
  <!-- Screen: Just Draw Prompt -->
```

Insert the following block immediately before it:

```html
  <!-- Screen: Mutations Type Picker -->
  <div id="screen-mutations-type" class="screen">
    <button class="back-btn" data-target="screen-mode-picker">←</button>
    <h2>Mutations</h2>
    <div class="mode-buttons">
      <button id="btn-type-organic-organic" class="mode-btn">Organic + Organic</button>
      <button id="btn-type-organic-synthetic" class="mode-btn">Organic + Synthetic</button>
      <button id="btn-type-synthetic-synthetic" class="mode-btn">Synthetic + Synthetic</button>
      <button id="btn-type-random" class="mode-btn">Random</button>
    </div>
  </div>

```

- [ ] **Step 2: Give the Imagination Prompt back button a unique ID**

Find this line in the `screen-imagine-prompt` div:
```html
    <button class="back-btn" data-target="screen-mode-picker">←</button>
```

Replace it with (remove `data-target` so it's excluded from the generic loop — the JS will handle it via `promptBackTarget`):
```html
    <button id="btn-back-imagine" class="back-btn">←</button>
```

- [ ] **Step 3: Verify the HTML structure looks right**

```bash
python3 -c "
import re
html = open('index.html').read()
screens = ['screen-home','screen-mode-picker','screen-mutations-type','screen-just-draw','screen-imagine-prompt']
for s in screens:
    assert f'id=\"{s}\"' in html, f'Missing screen: {s}'
    print(f'{s}: present')
assert 'btn-type-organic-organic' in html, 'Missing type button'
assert 'btn-back-imagine' in html, 'Missing dynamic back button'
print('All checks passed')
"
```

Expected output:
```
screen-home: present
screen-mode-picker: present
screen-mutations-type: present
screen-just-draw: present
screen-imagine-prompt: present
All checks passed
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add mutations type picker screen HTML"
```

---

### Task 2: Update JavaScript

**Files:**
- Modify: `index.html` (JS section, inside `<script>` tag)

- [ ] **Step 1: Update `generateMutation` to accept a type parameter**

Find and replace the entire `generateMutation` function:

Old:
```js
    function generateMutation() {
      const r = Math.random();
      let n1, n2;
      if (r < 1 / 3) {
        n1 = pick(store.nounsOrganic);
        n2 = pick(store.nounsOrganic);
      } else if (r < 2 / 3) {
        n1 = pick(store.nounsOrganic);
        n2 = pick(store.nounsSynthetic);
      } else {
        n1 = pick(store.nounsSynthetic);
        n2 = pick(store.nounsSynthetic);
      }
      return `${n1} + ${n2}`;
    }
```

New:
```js
    function generateMutation(type) {
      const types = ['organic-organic', 'organic-synthetic', 'synthetic-synthetic'];
      const t = type === 'random' ? types[Math.floor(Math.random() * 3)] : type;
      let n1, n2;
      if (t === 'organic-organic') {
        n1 = pick(store.nounsOrganic);
        n2 = pick(store.nounsOrganic);
      } else if (t === 'organic-synthetic') {
        n1 = pick(store.nounsOrganic);
        n2 = pick(store.nounsSynthetic);
      } else {
        n1 = pick(store.nounsSynthetic);
        n2 = pick(store.nounsSynthetic);
      }
      return `${n1} + ${n2}`;
    }
```

- [ ] **Step 2: Add `mutationType` and `promptBackTarget` state variables**

Find this line:
```js
    let imagineMode = null; // 'surreal' | 'mutations'
```

Replace with:
```js
    let imagineMode = null;    // 'surreal' | 'mutations'
    let mutationType = null;   // 'organic-organic' | 'organic-synthetic' | 'synthetic-synthetic' | 'random'
    let promptBackTarget = null;
```

- [ ] **Step 3: Update `btn-surreal` handler to set `promptBackTarget`**

Find:
```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      document.getElementById('imagine-prompt').textContent = generateSurrealNarrative();
      showScreen('screen-imagine-prompt');
    });
```

Replace with:
```js
    document.getElementById('btn-surreal').addEventListener('click', () => {
      imagineMode = 'surreal';
      promptBackTarget = 'screen-mode-picker';
      document.getElementById('imagine-prompt').textContent = generateSurrealNarrative();
      showScreen('screen-imagine-prompt');
    });
```

- [ ] **Step 4: Update `btn-mutations` handler to navigate to type picker**

Find:
```js
    document.getElementById('btn-mutations').addEventListener('click', () => {
      imagineMode = 'mutations';
      document.getElementById('imagine-prompt').textContent = generateMutation();
      showScreen('screen-imagine-prompt');
    });
```

Replace with:
```js
    document.getElementById('btn-mutations').addEventListener('click', () => {
      showScreen('screen-mutations-type');
    });
```

- [ ] **Step 5: Add type button click handlers**

Find:
```js
    document.getElementById('btn-regen-imagine').addEventListener('click', () => {
```

Insert the following block immediately before it:
```js
    ['organic-organic', 'organic-synthetic', 'synthetic-synthetic', 'random'].forEach(type => {
      document.getElementById(`btn-type-${type}`).addEventListener('click', () => {
        imagineMode = 'mutations';
        mutationType = type;
        promptBackTarget = 'screen-mutations-type';
        document.getElementById('imagine-prompt').textContent = generateMutation(type);
        showScreen('screen-imagine-prompt');
      });
    });

```

- [ ] **Step 6: Update `btn-regen-imagine` to pass `mutationType`**

Find:
```js
    document.getElementById('btn-regen-imagine').addEventListener('click', () => {
      if (!imagineMode) return;
      document.getElementById('imagine-prompt').textContent =
        imagineMode === 'surreal' ? generateSurrealNarrative() : generateMutation();
    });
```

Replace with:
```js
    document.getElementById('btn-regen-imagine').addEventListener('click', () => {
      if (!imagineMode) return;
      document.getElementById('imagine-prompt').textContent =
        imagineMode === 'surreal' ? generateSurrealNarrative() : generateMutation(mutationType);
    });
```

- [ ] **Step 7: Update the back-button loop and add dynamic handler for Imagination Prompt**

Find:
```js
    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => showScreen(btn.dataset.target));
    });
```

Replace with:
```js
    document.querySelectorAll('.back-btn[data-target]').forEach(btn => {
      btn.addEventListener('click', () => showScreen(btn.dataset.target));
    });

    document.getElementById('btn-back-imagine').addEventListener('click', () => {
      showScreen(promptBackTarget);
    });
```

- [ ] **Step 8: Verify JS structure with static checks**

```bash
python3 -c "
html = open('index.html').read()
checks = [
  ('generateMutation(type)', 'generateMutation accepts type param'),
  ('mutationType', 'mutationType state var'),
  ('promptBackTarget', 'promptBackTarget state var'),
  ('screen-mutations-type', 'type picker screen referenced in JS'),
  ('btn-type-organic-organic', 'type button handler'),
  ('btn-back-imagine', 'dynamic back button handler'),
  ('.back-btn[data-target]', 'scoped back-btn loop'),
  ('generateMutation(mutationType)', 'regen passes mutationType'),
  ('generateMutation(type)', 'type buttons pass type'),
]
for snippet, label in checks:
    assert snippet in html, f'MISSING: {label} ({snippet!r})'
    print(f'OK: {label}')
"
```

Expected output:
```
OK: generateMutation accepts type param
OK: mutationType state var
OK: promptBackTarget state var
OK: type picker screen referenced in JS
OK: type button handler
OK: dynamic back button handler
OK: scoped back-btn loop
OK: regen passes mutationType
OK: type buttons pass type
```

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: wire mutations type picker — dynamic back nav and typed generation"
```

---

### Task 3: Manual end-to-end verification

**Files:** none (browser testing)

- [ ] **Step 1: Start local server**

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

- [ ] **Step 2: Verify Mutations flow — Organic + Organic**

Home → "Can you imagine..." → "Mutations" → confirm new screen appears with heading "Mutations" and 4 buttons.

Click "Organic + Organic" → prompt appears as `word + word`. Click "↺ new prompt" several times — both words should be from the organic list (creatures, plants, people — e.g. "moth + fern", "wolf + coral"). Click "←" → returns to Mutations Type Picker (not Mode Picker).

- [ ] **Step 3: Verify Mutations flow — Organic + Synthetic**

From Mutations Type Picker, click "Organic + Synthetic" → prompt shows one organic + one synthetic noun (e.g. "octopus + clock"). Click "↺ new prompt" several times to confirm pattern holds. Click "←" → Mutations Type Picker.

- [ ] **Step 4: Verify Mutations flow — Synthetic + Synthetic**

Click "Synthetic + Synthetic" → both nouns synthetic (e.g. "gear + pendulum"). Regen confirms. Back → Mutations Type Picker.

- [ ] **Step 5: Verify Mutations flow — Random**

Click "Random" → prompt appears (any combination). Click "↺ new prompt" many times — should see a mix of organic+organic, organic+synthetic, and synthetic+synthetic combos across several tries. Back → Mutations Type Picker.

- [ ] **Step 6: Verify Surreal Narrative back nav unchanged**

Home → "Can you imagine..." → "Surreal Narrative" → prompt appears. Click "←" → returns to Mode Picker (not Mutations Type Picker). Confirms `promptBackTarget` is correctly set per path.

- [ ] **Step 7: Verify Mutations Type Picker back nav**

Home → "Can you imagine..." → "Mutations" → click "←" on Mutations Type Picker → returns to Mode Picker.
