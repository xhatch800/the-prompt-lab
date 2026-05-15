# Disable Regen When All Words Locked — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the `↺ new prompt` button on the Cauldron prompt screen whenever every enabled slot is locked, and re-enable it as soon as any slot is unlocked.

**Architecture:** Two changes to `index.html` only. Add a `:disabled` CSS rule for `.regen-btn` so the button looks visually inactive. Add lock-state logic at the end of `renderPrompt()`, which is already called on every lock/unlock, initial Generate, and history navigation — making it the single correct hook.

**Tech Stack:** Vanilla JS, single `index.html`. No test framework — verification via browser preview at `http://localhost:8080`.

---

## File structure

- Modify only: `index.html`
  - Add `.regen-btn:disabled` CSS rule after `.regen-btn:hover` (~line 249)
  - Add disabled-state sync at the end of `renderPrompt()` (~line 1346)

---

## Task 1: Add `.regen-btn:disabled` CSS rule

**Files:**
- Modify: `index.html` — insert after line 249 (after closing `}` of `.regen-btn:hover`)

- [ ] **Step 1: Locate the insertion point**

Open `index.html`. Find this block (around line 246):

```css
.regen-btn:hover {
  box-shadow: 1px 1px 0 #b85c38;
  transform: translate(2px, 2px);
}
```

- [ ] **Step 2: Insert the `:disabled` rule immediately after `.regen-btn:hover`**

```css
.regen-btn:disabled {
  opacity: 0.35;
  cursor: default;
  box-shadow: none;
}
```

- [ ] **Step 3: Verify in browser**

Start the server if not running: `python3 -m http.server 8080`
Open `http://localhost:8080`, open DevTools console, run:

```js
const btn = document.getElementById('btn-regen-just-draw');
btn.disabled = true;
// Button should appear faded (opacity 0.35), no shadow, default cursor
btn.disabled = false;
// Button should return to normal
console.log('CSS verified');
```

Expected: button visually dims when disabled and returns to normal when re-enabled.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add disabled style for regen button"
```

---

## Task 2: Sync regen button disabled state in `renderPrompt()`

**Files:**
- Modify: `index.html` — insert before the closing `}` of `renderPrompt()` (~line 1346)

- [ ] **Step 1: Locate the end of `renderPrompt()`**

Find this block (around line 1343–1346):

```js
        if (i < slots.length - 1) {
          const s = document.createElement('span');
          s.className = 'prompt-sep';
          s.textContent = sep;
          container.appendChild(s);
        }
      });
    }
```

The closing `}` on the last line is the end of `renderPrompt()`.

- [ ] **Step 2: Insert disabled-state sync before the closing `}`**

Replace the closing `}` with:

```js
        if (i < slots.length - 1) {
          const s = document.createElement('span');
          s.className = 'prompt-sep';
          s.textContent = sep;
          container.appendChild(s);
        }
      });
    }

    // Sync regen button disabled state with lock state
    const regenBtn = document.getElementById('btn-regen-imagine');
    if (regenBtn) {
      const activeSlots = (mode === 'cauldron' && cauldronConfig)
        ? cauldronConfig.slots.filter(s => s.enabled)
        : [];
      const allLocked = activeSlots.length > 0 &&
        activeSlots.every(s => lockedSlots[s.id]);
      regenBtn.disabled = allLocked;
    }
  }
```

Note: the sync block is added inside `renderPrompt()`, just before its closing `}`. The final `}` closes the function.

- [ ] **Step 3: Verify no-lock state — button enabled**

Open `http://localhost:8080`. Click **✦ Surreal Cauldron**, configure with default preset, tap **Generate ↓**. In DevTools console:

```js
// No words locked — button should be enabled
console.assert(!document.getElementById('btn-regen-imagine').disabled, 'Button enabled when nothing locked');
console.log('✓ Button enabled with no locks');
```

Expected: `✓ Button enabled with no locks`

- [ ] **Step 4: Verify all-locked state — button disabled**

In the app, tap every word to lock them all. Then in DevTools console:

```js
// All words locked — button should be disabled
console.assert(document.getElementById('btn-regen-imagine').disabled, 'Button disabled when all locked');
console.log('✓ Button disabled when all locked');
```

Expected: `✓ Button disabled when all locked`

- [ ] **Step 5: Verify unlock re-enables button**

In the app, tap one locked word to unlock it. Then in DevTools console:

```js
// One word unlocked — button should be enabled again
console.assert(!document.getElementById('btn-regen-imagine').disabled, 'Button re-enabled after unlock');
console.log('✓ Button re-enabled after unlock');
```

Expected: `✓ Button re-enabled after unlock`

- [ ] **Step 6: Verify Just Draw regen is unaffected**

Go to Home, click **Everyday Life**. In DevTools console:

```js
// Just Draw regen should never be disabled
console.assert(!document.getElementById('btn-regen-just-draw').disabled, 'Just Draw regen unaffected');
console.log('✓ Just Draw regen unaffected');
```

Expected: `✓ Just Draw regen unaffected`

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: disable regen when all cauldron words are locked"
```
