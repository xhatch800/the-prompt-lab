# Extract CSS and JS from index.html — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `index.html` into three files — `index.html` (HTML only), `style.css` (CSS), and `app.js` (JavaScript) — with no logic changes.

**Architecture:** Pure file extraction. CSS moves verbatim from `<style>` (lines 10–917) to `style.css`; JS moves verbatim from `<script>` (lines 1444–2595) to `app.js`. `index.html` is updated to reference both external files. No build step — plain `<link>` and `<script src>` tags. Works on GitHub Pages and the local python HTTP server unchanged.

**Tech Stack:** Vanilla HTML/CSS/JS, python3 HTTP server (`python3 -m http.server 8080`), GitHub Pages static hosting.

**Branch rule:** NEVER commit to main. All work on a feature branch, merged via PR.

---

## File Structure

- Modify: `index.html` — remove inline `<style>` and `<script>` blocks, add external file references
- Create: `style.css` — verbatim CSS extracted from `index.html` lines 11–916
- Create: `app.js` — verbatim JS extracted from `index.html` lines 1445–2594

---

### Task 1: Create style.css

**Files:**
- Create: `style.css`
- Modify: `index.html:10–917`

- [ ] **Step 1: Extract CSS into style.css**

Copy lines 11–916 of `index.html` (everything between `<style>` and `</style>`, not including the tags themselves) verbatim into a new file `style.css` at the repo root.

Verify the line count:
```bash
wc -l style.css
```
Expected: ~906 lines.

Verify first and last lines look like CSS (not HTML tags):
```bash
head -3 style.css
tail -3 style.css
```
Expected: first line starts with `*, *::before` (or similar CSS rule), last lines end with a closing `}`.

- [ ] **Step 2: Replace the `<style>` block in index.html**

In `index.html`, replace the entire `<style>` block (lines 10–917):

```html
  <style>
    ...908 lines of CSS...
  </style>
```

With a single link tag:

```html
  <link rel="stylesheet" href="style.css">
```

The line should go in the same position in `<head>`, after the Google Fonts `<link>` tags (line 9).

Verify no `<style>` tag remains:
```bash
grep -n "<style>" index.html
```
Expected: no output.

Verify the link tag is present:
```bash
grep -n "style.css" index.html
```
Expected: one line containing `<link rel="stylesheet" href="style.css">`.

- [ ] **Step 3: Verify in browser**

Start server from repo root: `python3 -m http.server 8080`

Open `http://localhost:8080`. Check:
- Page renders with correct fonts, colors, and layout (cream background, rust-colored buttons)
- No FOUC (flash of unstyled content)
- Open DevTools → Console: no errors

- [ ] **Step 4: Commit**

```bash
git add style.css index.html
git commit -m "refactor: extract CSS into style.css"
```

---

### Task 2: Create app.js

**Files:**
- Create: `app.js`
- Modify: `index.html:1444–2595` (after Task 1, line numbers will have shifted — search for `<script>` tag)

- [ ] **Step 1: Extract JS into app.js**

Copy everything between `<script>` and `</script>` (not including the tags themselves) verbatim into a new file `app.js` at the repo root. In the current file after Task 1's edits, search for the `<script>` tag — it was originally at line 1444 but will have shifted up by ~907 lines.

```bash
grep -n "<script>" index.html
```
Use that line number to identify the block. Copy lines between `<script>` and `</script>` (exclusive) into `app.js`.

Verify the line count:
```bash
wc -l app.js
```
Expected: ~1,150 lines.

Verify first and last lines look like JS (not HTML tags):
```bash
head -3 app.js
tail -5 app.js
```
Expected: first line is `// ── Data store ──` (or the `const store = {};` line), last lines include `init();`.

- [ ] **Step 2: Replace the `<script>` block in index.html**

In `index.html`, replace the entire `<script>...</script>` block with:

```html
  <script src="app.js" defer></script>
```

Place this just before the `</body>` tag.

The `defer` attribute ensures `app.js` executes after the DOM is fully parsed — same timing as an inline script at the end of `<body>`.

Verify no `<script>` block remains:
```bash
grep -n "<script>" index.html
```
Expected: one line containing `<script src="app.js" defer></script>` only.

Verify `app.js` reference is present:
```bash
grep -n "app.js" index.html
```
Expected: one line.

Verify `index.html` line count is now roughly 530–540 lines:
```bash
wc -l index.html
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8080` (hard reload: Cmd+Shift+R).

Check:
- Home screen shows: Everyday Life, Strange Scenes, ✦ Surreal Cauldron
- Everyday Life: tap → prompt renders, regen works, filter sheet opens with subject chips
- Strange Scenes: tap → prompt renders, regen works, filter sheet opens with theme chips
- Surreal Cauldron: tap → config screen loads, generate produces a prompt
- DevTools → Console: no errors
- DevTools → Network: `style.css` and `app.js` both show 200 status

- [ ] **Step 4: Commit**

```bash
git add app.js index.html
git commit -m "refactor: extract JavaScript into app.js"
```
