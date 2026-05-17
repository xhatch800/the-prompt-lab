# Extract Wallpaper SVG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 393-line inline SVG wallpaper out of `index.html` into `assets/wallpaper.svg` and load it via CSS `background-image`, reducing `index.html` from 490 lines to ~90 lines.

**Architecture:** The `<svg>` element (lines 16–409 of `index.html`) is extracted verbatim into a standalone SVG file with `width`/`height` attributes removed; `css/style.css` gains three `background-image` properties on the existing `#wallpaper-layer` rule; `index.html` replaces the entire wallpaper block with a single empty `<div>`. The `#wallpaper-layer` div and its JS `dimmed` class toggle are untouched.

**Tech Stack:** Static HTML/CSS, no build step, no bundler. Served via any static file server (e.g. `python3 -m http.server 8080`). GitHub Pages compatible.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `assets/wallpaper.svg` | Create | Standalone SVG wallpaper, sized by CSS |
| `css/style.css` | Modify (lines 262–269) | Add `background-image` to `#wallpaper-layer` |
| `index.html` | Modify (lines 14–410) | Replace wallpaper block with empty `<div>` |

---

### Task 1: Create a feature branch

**Files:**
- No file changes — branch setup only

- [ ] **Step 1: Create and check out a branch**

```bash
git checkout -b extract-wallpaper-svg
```

Expected output:
```
Switched to a new branch 'extract-wallpaper-svg'
```

---

### Task 2: Extract the SVG into `assets/wallpaper.svg`

**Files:**
- Create: `assets/wallpaper.svg`

Context: `index.html` currently has the wallpaper `<svg>` element at lines 16–409. The opening tag is:
```html
<svg width="100%" height="100%" viewBox="0 0 420 900"
     preserveAspectRatio="xMidYMid slice"
     xmlns="http://www.w3.org/2000/svg">
```
We need to copy the entire `<svg>…</svg>` block into a new file, but **remove the `width` and `height` attributes** (CSS will handle sizing). Keep `viewBox` and `preserveAspectRatio` exactly as-is.

- [ ] **Step 1: Extract the SVG block from `index.html`**

Run this command to pull lines 16–409 into the new file:

```bash
sed -n '16,409p' index.html > assets/wallpaper.svg
```

- [ ] **Step 2: Remove the `width` and `height` attributes from the opening `<svg>` tag**

Open `assets/wallpaper.svg`. The first line will be:
```
    <svg width="100%" height="100%" viewBox="0 0 420 900"
```

Edit it so it reads (remove the leading spaces too — this is the root element of the file):
```xml
<svg viewBox="0 0 420 900"
     preserveAspectRatio="xMidYMid slice"
     xmlns="http://www.w3.org/2000/svg">
```

The file should start with `<svg viewBox=` — no DOCTYPE, no `<html>`, no wrapper. The closing `</svg>` tag (last line of the file) stays unchanged.

- [ ] **Step 3: Verify the SVG file looks correct**

```bash
head -5 assets/wallpaper.svg
tail -3 assets/wallpaper.svg
wc -l assets/wallpaper.svg
```

Expected `head` output:
```xml
<svg viewBox="0 0 420 900"
     preserveAspectRatio="xMidYMid slice"
     xmlns="http://www.w3.org/2000/svg">

      <!-- ══ TOP STRIP (y 0–160) ══ -->
```

Expected `tail` output:
```xml

    </svg>
```

Expected line count: ~394 lines.

- [ ] **Step 4: Commit**

```bash
git add assets/wallpaper.svg
git commit -m "feat: extract wallpaper SVG into assets/wallpaper.svg"
```

---

### Task 3: Add CSS background-image to `#wallpaper-layer`

**Files:**
- Modify: `css/style.css` (around line 262)

Context: The existing `#wallpaper-layer` rule in `css/style.css` is:
```css
#wallpaper-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.22;
  transition: opacity 0.3s ease;
}
```

Add three lines so it becomes:
```css
#wallpaper-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.22;
  transition: opacity 0.3s ease;
  background-image: url(../assets/wallpaper.svg);
  background-size: cover;
  background-position: center;
}
```

- [ ] **Step 1: Edit `css/style.css`**

Add the three lines shown above inside the `#wallpaper-layer` rule, after `transition: opacity 0.3s ease;`.

- [ ] **Step 2: Verify the diff**

```bash
git diff css/style.css
```

Expected diff (3 lines added, 0 removed):
```diff
+  background-image: url(../assets/wallpaper.svg);
+  background-size: cover;
+  background-position: center;
```

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: load wallpaper via CSS background-image on #wallpaper-layer"
```

---

### Task 4: Replace the inline SVG block in `index.html` with an empty div

**Files:**
- Modify: `index.html` (lines 14–410)

Context: The current wallpaper block in `index.html` is lines 14–410:
```html
  <!-- Wallpaper -->
  <div id="wallpaper-layer">
    <svg width="100%" height="100%" viewBox="0 0 420 900"
         preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">
      ... (393 lines of SVG) ...
    </svg>
  </div>
```

Replace the entire block (lines 14–410) with:
```html
  <!-- Wallpaper -->
  <div id="wallpaper-layer"></div>
```

**Important:** Line 411 (`<!-- Screen: Home -->`) must remain untouched. After the edit, the home screen comment should immediately follow the wallpaper div.

- [ ] **Step 1: Edit `index.html`**

Replace lines 14–410 with the two-line replacement shown above. Use your editor or the following commands:

```bash
# Preview: confirm lines 14–411 are what we expect
sed -n '14,15p' index.html   # should show: <!-- Wallpaper --> + <div id="wallpaper-layer">
sed -n '409,411p' index.html # should show: </svg> + </div> + blank/<!-- Screen: Home -->
```

Then make the replacement so the result is:
```
line 14: (blank line before the comment is fine to keep)
line 14: <!-- Wallpaper -->
line 15: <div id="wallpaper-layer"></div>
line 16: (blank line)
line 17: <!-- Screen: Home -->
```

- [ ] **Step 2: Verify line count**

```bash
wc -l index.html
```

Expected: approximately 90 lines (was 490; removed ~400 lines of SVG content).

- [ ] **Step 3: Verify structure**

```bash
grep -n "wallpaper-layer\|screen-home\|screen-prompt\|screen-cauldron" index.html
```

Expected output (line numbers will shift but the order must be preserved):
```
14:  <!-- Wallpaper -->
15:  <div id="wallpaper-layer"></div>
17:  <!-- Screen: Home -->
...  <div id="screen-home" ...>
...  <div id="screen-prompt" ...>
...  <div id="screen-cauldron-config" ...>
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: replace inline SVG wallpaper in index.html with empty div"
```

---

### Task 5: Smoke-test in the browser and open a PR

**Files:**
- No code changes

- [ ] **Step 1: Start a local server from the project root**

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser.

- [ ] **Step 2: Verify visual appearance**

Check:
1. The wallpaper (pencils, crescent moon, stars, wavy lines, etc.) is visible on the home screen at the same opacity as before.
2. The wallpaper dims when navigating to a prompt screen (opacity drops — the `dimmed` class is still toggled by JS).
3. The wallpaper covers the full viewport without gaps or distortion.
4. All three mode buttons are visible and functional.

If the wallpaper is missing: confirm `assets/wallpaper.svg` starts with `<svg viewBox=` and that `css/style.css` has the correct `url(../assets/wallpaper.svg)` path (relative from `css/` up one level to project root, then into `assets/`).

- [ ] **Step 3: Push and open a PR**

```bash
git push -u origin extract-wallpaper-svg
gh pr create --title "Extract wallpaper SVG from index.html" --body "$(cat <<'EOF'
## Summary
- Moves the 393-line inline SVG wallpaper out of `index.html` into `assets/wallpaper.svg`
- Loads it via `background-image` on `#wallpaper-layer` in `css/style.css`
- Replaces the wallpaper block in `index.html` with a single empty `<div>`
- Result: `index.html` drops from 490 lines to ~90 lines; no behaviour changes

## Test Plan
- [ ] Wallpaper visible on home screen at expected opacity
- [ ] Wallpaper dims correctly when a prompt screen is shown
- [ ] Wallpaper covers full viewport with no gaps
- [ ] All three mode buttons work (Everyday Life, Strange Scenes, Surreal Cauldron)
EOF
)"
```
