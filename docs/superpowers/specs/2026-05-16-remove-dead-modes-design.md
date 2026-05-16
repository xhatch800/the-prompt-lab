# Remove Dead Modes — Design Spec

**Date:** 2026-05-16
**Feature:** Delete Surreal Narratives and Strange Combinations dead code

---

## Summary

Remove all HTML, JavaScript, and commented-out code belonging to two abandoned modes: Surreal Narratives and the standalone Strange Combinations type picker. Both are fully superseded by Surreal Cauldron. This is a pure deletion — no new code, no behavior changes.

---

## What Gets Deleted

### HTML

1. Two commented-out home screen buttons in `.mode-buttons`:
   ```html
   <!--      <button id="btn-surreal" class="mode-btn">Surreal Narratives</button>-->
   <!--      <button id="btn-mutations" class="mode-btn">Strange Combinations</button>-->
   ```

2. The entire `screen-mutations-type` div — the Strange Combinations type picker screen (contains `btn-type-organic-organic`, `btn-type-organic-synthetic`, `btn-type-synthetic-synthetic`, `btn-type-random`).

### JavaScript

1. The `/** ... **/` commented-out block containing `btn-surreal` and `btn-mutations` click handlers.

2. The active `btn-type-*` forEach event listener block (all four type button listeners).

---

## What Is Not Changing

- Surreal Cauldron — untouched
- All other screens and modes — untouched
- No CSS changes needed (no orphaned styles found for these IDs)

---

## Verification

After deletion:
- Home screen still shows Everyday Life, Strange Scenes, Surreal Cauldron
- Surreal Cauldron opens and works as before
- No JS errors in console
