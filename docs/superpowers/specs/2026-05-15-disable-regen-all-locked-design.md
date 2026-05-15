# Disable Regen When All Words Locked — Design Spec

## Goal

Disable the `↺ new prompt` button on the Cauldron prompt screen when every enabled slot is locked. Re-enable as soon as any slot is unlocked.

---

## Scope

- Applies only to the **Cauldron prompt screen** (`btn-regen-imagine`)
- Just Draw has no lockable words — its regen button (`btn-regen-just-draw`) is untouched
- Surreal/mutation modes are unreachable from the UI — no special handling needed

---

## Implementation

### One logic change: `renderPrompt()`

`renderPrompt(container, mode)` is already called on every lock/unlock, on initial Generate, and on history navigation. Add at the end of the function:

```js
const regenBtn = document.getElementById('btn-regen-imagine');
if (regenBtn) {
  const activeSlots = (mode === 'cauldron' && cauldronConfig)
    ? cauldronConfig.slots.filter(s => s.enabled)
    : [];
  const allLocked = activeSlots.length > 0 &&
    activeSlots.every(s => lockedSlots[s.id]);
  regenBtn.disabled = allLocked;
}
```

### One CSS addition: disabled style for `.regen-btn`

```css
.regen-btn:disabled {
  opacity: 0.35;
  cursor: default;
  box-shadow: none;
}
```

---

## Behaviour

| State | Button |
|-------|--------|
| No slots locked | Enabled |
| Some slots locked, some unlocked | Enabled |
| All enabled slots locked | Disabled (opacity 0.35, no shadow) |
| Any slot unlocked | Re-enabled immediately |

---

## Reset

No additional reset logic needed. `renderPrompt()` is already the single source of truth for prompt state and is called on every relevant event.
