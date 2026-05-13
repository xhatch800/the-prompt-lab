# Typography Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase font sizes across the app so menu elements are bolder and the prompt text unmistakably owns the screen.

**Architecture:** All changes are CSS-only inside the `<style>` block of `index.html`. No JS, no structural HTML changes. Desktop sizes are updated first, then the mobile breakpoint (`max-width: 480px`) is updated to match the new scale.

**Tech Stack:** Vanilla HTML/CSS, no dependencies, no build step.

---

## File Map

| File | Action |
|---|---|
| `index.html` | Modify — update font-size values in `<style>` block |

---

### Task 1: Update desktop font sizes

**Files:**
- Modify: `index.html` (CSS `<style>` block, desktop rules)

- [ ] **Step 1: Update `h1` font size**

Find:
```css
    h1 {
      font-size: 3rem;
```

Replace with:
```css
    h1 {
      font-size: 4rem;
```

- [ ] **Step 2: Update `h2` font size**

Find:
```css
    h2 {
      font-size: 2rem;
```

Replace with:
```css
    h2 {
      font-size: 2.7rem;
```

- [ ] **Step 3: Update `.prompt-text` font size**

Find:
```css
    .prompt-text {
      font-size: 2rem;
```

Replace with:
```css
    .prompt-text {
      font-size: 3.5rem;
```

- [ ] **Step 4: Update `.mode-btn` font size**

Find:
```css
    .mode-btn {
      font-family: 'Caveat', cursive;
      font-size: 1.8rem;
```

Replace with:
```css
    .mode-btn {
      font-family: 'Caveat', cursive;
      font-size: 2.4rem;
```

- [ ] **Step 5: Update `.back-btn` font size**

Find:
```css
    .back-btn {
      font-family: 'Caveat', cursive;
      font-size: 1.6rem;
```

Replace with:
```css
    .back-btn {
      font-family: 'Caveat', cursive;
      font-size: 2rem;
```

- [ ] **Step 6: Update `.regen-btn` font size**

Find:
```css
    .regen-btn {
      font-family: 'Caveat', cursive;
      font-size: 1.4rem;
```

Replace with:
```css
    .regen-btn {
      font-family: 'Caveat', cursive;
      font-size: 1.8rem;
```

- [ ] **Step 7: Verify desktop sizes with static check**

```bash
python3 -c "
import re
css = open('index.html').read()
checks = [
  ('font-size: 4rem',    'h1 desktop'),
  ('font-size: 2.7rem',  'h2 desktop'),
  ('font-size: 3.5rem',  'prompt-text desktop'),
  ('font-size: 2.4rem',  'mode-btn desktop'),
  ('font-size: 2rem',    'back-btn desktop'),
  ('font-size: 1.8rem',  'regen-btn desktop'),
]
for snippet, label in checks:
    assert snippet in css, f'MISSING: {label} ({snippet!r})'
    print(f'OK: {label}')
"
```

Expected output:
```
OK: h1 desktop
OK: h2 desktop
OK: prompt-text desktop
OK: mode-btn desktop
OK: back-btn desktop
OK: regen-btn desktop
```

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: bump desktop font sizes for stronger visual hierarchy"
```

---

### Task 2: Update mobile breakpoint font sizes

**Files:**
- Modify: `index.html` (CSS `<style>` block, `@media (max-width: 480px)` rule)

- [ ] **Step 1: Update mobile `h1` size**

Find inside `@media (max-width: 480px)`:
```css
      h1 { font-size: 2.4rem; }
```

Replace with:
```css
      h1 { font-size: 3.2rem; }
```

- [ ] **Step 2: Update mobile `h2` size**

Find inside `@media (max-width: 480px)`:
```css
      h2 { font-size: 1.6rem; }
```

Replace with:
```css
      h2 { font-size: 2.2rem; }
```

- [ ] **Step 3: Update mobile `.prompt-text` size**

Find inside `@media (max-width: 480px)`:
```css
      .prompt-text { font-size: 1.8rem; }
```

Replace with:
```css
      .prompt-text { font-size: 2.8rem; }
```

- [ ] **Step 4: Update mobile `.mode-btn` size**

Find inside `@media (max-width: 480px)`:
```css
      .mode-btn { font-size: 1.5rem; padding: 0.8rem 1.5rem; }
```

Replace with:
```css
      .mode-btn { font-size: 2rem; padding: 0.8rem 1.5rem; }
```

- [ ] **Step 5: Verify mobile sizes with static check**

```bash
python3 -c "
css = open('index.html').read()
checks = [
  ('font-size: 3.2rem', 'h1 mobile'),
  ('font-size: 2.2rem', 'h2 mobile'),
  ('font-size: 2.8rem', 'prompt-text mobile'),
  ('font-size: 2rem',   'mode-btn mobile'),
]
for snippet, label in checks:
    assert snippet in css, f'MISSING: {label} ({snippet!r})'
    print(f'OK: {label}')
"
```

Expected output:
```
OK: h1 mobile
OK: h2 mobile
OK: prompt-text mobile
OK: mode-btn mobile
```

- [ ] **Step 6: Manual browser verification**

Start a local server:
```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` and verify:

1. **Home screen** — "The Prompt Lab" title feels large and bold. Mode buttons are thumb-friendly and clearly readable.
2. **Just Draw prompt** — The prompt text dominates the screen. It is clearly bigger than any heading or button.
3. **Surreal Narrative prompt** — Same as above; the four-word prompt fills the centre of the screen with presence.
4. **Mutations prompt** — `word + word` is large and easy to read at a glance.
5. **Mobile emulation** — Toggle DevTools to a 375px viewport. All text remains readable and the prompt text still commands attention.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: bump mobile font sizes to match new typographic scale"
```
