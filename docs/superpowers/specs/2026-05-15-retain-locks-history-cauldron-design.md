# Retain Locks & History When Backing to Cauldron Config — Design Spec

## Goal

When the user backs from the cauldron prompt screen to the config screen, preserve their locked words and prompt history. When they hit Generate again, only unlocked slots regenerate; locked words carry over and the new generation appends to history.

---

## State Rules

| Navigation | Locks | History | currentPrompt |
|-----------|-------|---------|---------------|
| Home → Cauldron config (`btn-cauldron`) | Clear ✅ already correct | Clear ✅ already correct | Unchanged (irrelevant — lockedSlots is empty so all slots regenerate) |
| Config → Prompt (`cc-generate`) | **Keep** — regenerate only unlocked | **Append** new generation | Set to new generated prompt |
| Prompt → Config (`btn-back-imagine`) | **Keep** ✅ already correct | **Keep** ✅ already correct | Unchanged |
| Config → Home (`btn-cauldron-back`) | Clear ✅ already correct via `showScreen` | Clear ✅ already correct via `showScreen` | Reset to null via `showScreen` |

---

## Why the fix is small

`showScreen()` already conditionally clears state — it only resets `lockedSlots`, `currentPrompt`, and history when navigating to a screen outside the cauldron trio (`screen-just-draw`, `screen-imagine-prompt`, `screen-cauldron-config`). So prompt → config navigation is already safe.

The only problem is `cc-generate`, which explicitly resets both before generating.

---

## The One Change: `cc-generate` handler

**Current (lines 2011–2029):**
```js
document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  clearHistory();           // ← remove this
  lockedSlots = {};         // ← remove this
  cauldronDecks = {};
  imagineMode = 'cauldron';
  promptBackTarget = 'screen-cauldron-config';
  currentPrompt = generateCauldron(cauldronConfig, null, {});   // ← fix args
  ...
  pushToHistory(currentPrompt);
  ...
});
```

**After:**
```js
document.getElementById('cc-generate').addEventListener('click', () => {
  if (!cauldronConfig) return;
  cauldronDecks = {};
  imagineMode = 'cauldron';
  promptBackTarget = 'screen-cauldron-config';
  currentPrompt = generateCauldron(cauldronConfig, currentPrompt, lockedSlots);
  ...
  pushToHistory(currentPrompt);
  ...
});
```

Three changes:
1. Remove `clearHistory()`
2. Remove `lockedSlots = {}`
3. `generateCauldron(cauldronConfig, null, {})` → `generateCauldron(cauldronConfig, currentPrompt, lockedSlots)`

---

## Edge Cases

**First-ever Generate (fresh from home):**
- `btn-cauldron` explicitly resets `lockedSlots = {}` and calls `clearHistory()` before showing config
- So on first Generate: `lockedSlots = {}` and `currentPrompt` may be null or stale
- `generateCauldron` only uses `current[slot.id]` for locked slots — with empty `lockedSlots`, it ignores `currentPrompt` entirely and generates everything fresh ✅

**Add a component after backing in:**
- New slot has no entry in `lockedSlots` → generates fresh ✅

**Remove a component after backing in:**
- Slot no longer in `cauldronConfig.slots` → doesn't appear in prompt (locked or not) ✅

**Change tags on an unlocked slot:**
- Slot is unlocked → new pool is used for generation ✅

**Change tags on a locked slot:**
- Slot is locked → `generateCauldron` returns `current[slot.id]` unchanged; tag change takes effect only after unlocking on the prompt screen ✅

**`cauldronDecks = {}`:**
- Kept in the reset — decks reset on every Generate since config may have changed ✅

---

## What is NOT changing

- `showScreen()` — already correct
- `btn-cauldron` handler — already resets locks + history correctly on home entry
- `btn-cauldron-back` handler — already resets via `showScreen('screen-home')`
- `btn-back-imagine` handler — already preserves state (navigates to cauldron-config, which is in the exclusion list)
- `generateCauldron()` internals — already respects locked slots correctly
