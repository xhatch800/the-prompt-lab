# Typography Scale Design

## Goal

Increase font sizes across the app so menu elements command attention and the prompt text clearly owns the screen as the hero element.

## Approach

Tiered emphasis: menu elements get a ~35% bump; prompt text gets a larger jump to make it unmistakably the focal point of each prompt screen.

## Scope

All changes are CSS-only, inside the `<style>` block in `index.html`. No structural or JS changes.

## Size Changes

### Menu Elements (~35% increase)

| Selector | Current | New |
|---|---|---|
| `h1` | `3rem` | `4rem` |
| `h2` | `2rem` | `2.7rem` |
| `.mode-btn` | `1.8rem` | `2.4rem` |
| `.back-btn` | `1.6rem` | `2rem` |
| `.regen-btn` | `1.4rem` | `1.8rem` |

### Prompt Text (hero jump)

| Selector | Current | New |
|---|---|---|
| `.prompt-text` | `2rem` | `3.5rem` |

### Mobile Breakpoint (`max-width: 480px`)

| Selector | Current | New |
|---|---|---|
| `h1` | `2.4rem` | `3.2rem` |
| `h2` | `1.6rem` | `2.2rem` |
| `.mode-btn` | `1.5rem` | `2rem` |
| `.prompt-text` | `1.8rem` | `2.8rem` |

## Design Rationale

- The prompt text is the primary reason a user opens the app — it should read like a command, not a caption.
- Menu text needs to feel confident and readable at arm's length on a phone.
- The tiered scale preserves visual hierarchy: prompt > heading > button > utility controls.
- No layout changes needed; existing `max-width`, `line-height`, and padding values accommodate the larger sizes.
