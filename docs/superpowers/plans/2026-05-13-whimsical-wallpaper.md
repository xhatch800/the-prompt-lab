# Whimsical Wallpaper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **⚠️ No commits until the user explicitly approves.** Skip all `git commit` steps. Make changes, verify them, then stop and wait.

**Goal:** Add a fixed illustrated wallpaper of scattered whimsical doodles (pencils, gears, clocks, unicorn, dragon, etc.) behind all app screens, with opacity 0.22 by default and 0.12 on the prompt screen.

**Architecture:** A single `<div id="wallpaper-layer">` with an inline SVG (viewBox 420×900, `preserveAspectRatio="xMidYMid slice"`) sits as the first child of `<body>`, `position: fixed; inset: 0; z-index: 0; pointer-events: none`. All `.screen` divs get `z-index: 1`. `showScreen()` toggles a `.dimmed` CSS class on the wallpaper layer when navigating to `screen-imagine-prompt`. All changes are in `index.html`.

**Tech Stack:** Vanilla HTML/CSS/JS, inline SVG, no dependencies, no build step.

---

## File Map

| File | Action |
|---|---|
| `index.html` | Modify — CSS additions, one new HTML element, one JS line |

---

### Task 1: Add CSS rules

**Files:**
- Modify: `index.html` (CSS `<style>` block, lines ~26-208)

- [ ] **Step 1: Add `z-index: 1` to the existing `.screen` rule**

Find:
```css
    .screen {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
```

Replace with:
```css
    .screen {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 1;
    }
```

- [ ] **Step 2: Add wallpaper CSS after the `.hidden` rule**

Find:
```css
    .hidden {
      display: none;
    }
```

Insert immediately after:
```css
    /* ── Wallpaper ── */
    #wallpaper-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: 0.22;
      transition: opacity 0.3s ease;
    }

    #wallpaper-layer.dimmed {
      opacity: 0.12;
    }
```

- [ ] **Step 3: Verify with static check**

```bash
python3 -c "
css = open('index.html').read()
checks = [
  ('z-index: 1', 'z-index on .screen'),
  ('#wallpaper-layer', 'wallpaper layer rule'),
  ('opacity: 0.22', 'default opacity'),
  ('#wallpaper-layer.dimmed', 'dimmed modifier'),
  ('opacity: 0.12', 'dimmed opacity'),
  ('transition: opacity 0.3s ease', 'opacity transition'),
]
for snippet, label in checks:
    assert snippet in css, f'MISSING: {label}'
    print(f'OK: {label}')
print('All checks passed')
"
```

Expected:
```
OK: z-index on .screen
OK: wallpaper layer rule
OK: default opacity
OK: dimmed modifier
OK: dimmed opacity
OK: opacity transition
All checks passed
```

---

### Task 2: Insert the wallpaper HTML element with inline SVG

**Files:**
- Modify: `index.html` (HTML `<body>`, before first `.screen` div)

- [ ] **Step 1: Insert `#wallpaper-layer` as first child of `<body>`**

Find:
```html
<body>

  <!-- Screen: Home -->
  <div id="screen-home" class="screen active">
```

Replace with:
```html
<body>

  <!-- Wallpaper -->
  <div id="wallpaper-layer">
    <svg width="100%" height="100%" viewBox="0 0 420 900"
         preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">

      <!-- ══ TOP STRIP (y 0–160) ══ -->

      <!-- PENCIL top-left, steep angle -->
      <g transform="translate(38,55) rotate(-40)">
        <rect x="-4" y="-26" width="8" height="42" rx="1" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <polygon points="-4,16 4,16 0,26" stroke="#2c2c2c" stroke-width="1.2" fill="none"/>
        <line x1="-4" y1="9" x2="4" y2="9" stroke="#2c2c2c" stroke-width="1"/>
        <rect x="-4" y="-26" width="8" height="7" rx="1" stroke="#2c2c2c" stroke-width="1" fill="#2c2c2c" fill-opacity="0.15"/>
      </g>

      <!-- CRESCENT MOON -->
      <g transform="translate(120,45)">
        <path d="M8,-18 Q-12,-14 -12,2 Q-12,18 8,20 Q-8,18 -10,2 Q-10,-14 8,-18Z" stroke="#b85c38" stroke-width="1.4" fill="none"/>
      </g>

      <!-- GEAR large -->
      <g transform="translate(215,60)">
        <circle cx="0" cy="0" r="16" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <circle cx="0" cy="0" r="6" stroke="#2c2c2c" stroke-width="1.2" fill="none"/>
        <rect x="-3.5" y="-21" width="7" height="6" rx="1" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
        <rect x="-3.5" y="15" width="7" height="6" rx="1" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
        <rect x="15" y="-3.5" width="6" height="7" rx="1" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
        <rect x="-21" y="-3.5" width="6" height="7" rx="1" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
        <g transform="rotate(45)">
          <rect x="-3.5" y="-21" width="7" height="6" rx="1" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
          <rect x="-3.5" y="15" width="7" height="6" rx="1" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
          <rect x="15" y="-3.5" width="6" height="7" rx="1" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
          <rect x="-21" y="-3.5" width="6" height="7" rx="1" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
        </g>
      </g>

      <!-- POCKET WATCH top-right -->
      <g transform="translate(355,80)">
        <path d="M0,-22 Q7,-32 0,-40 Q-7,-32 0,-22" stroke="#b85c38" stroke-width="1.3" fill="none"/>
        <rect x="-4" y="-22" width="8" height="6" rx="2" stroke="#b85c38" stroke-width="1.2" fill="none"/>
        <circle cx="0" cy="0" r="21" stroke="#b85c38" stroke-width="1.5" fill="none"/>
        <circle cx="0" cy="0" r="17" stroke="#b85c38" stroke-width="0.7" fill="none"/>
        <line x1="0" y1="0" x2="0" y2="-13" stroke="#b85c38" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="9" y2="7" stroke="#b85c38" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="0" y1="-17" x2="0" y2="-13" stroke="#b85c38" stroke-width="1.2"/>
        <line x1="0" y1="13" x2="0" y2="17" stroke="#b85c38" stroke-width="1.2"/>
        <line x1="13" y1="0" x2="17" y2="0" stroke="#b85c38" stroke-width="1.2"/>
        <line x1="-17" y1="0" x2="-13" y2="0" stroke="#b85c38" stroke-width="1.2"/>
        <circle cx="0" cy="0" r="2.2" fill="#b85c38" opacity="0.6"/>
      </g>

      <!-- COMET -->
      <g transform="translate(165,95) rotate(-30)">
        <ellipse cx="0" cy="0" rx="7" ry="4" stroke="#b85c38" stroke-width="1.2" fill="none"/>
        <line x1="7" y1="0" x2="34" y2="0" stroke="#b85c38" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
        <line x1="9" y1="-2" x2="30" y2="-5" stroke="#b85c38" stroke-width="0.7" stroke-linecap="round" opacity="0.3"/>
        <line x1="9" y1="2" x2="28" y2="6" stroke="#b85c38" stroke-width="0.7" stroke-linecap="round" opacity="0.3"/>
      </g>

      <!-- SMALL GEAR top area -->
      <g transform="translate(168,128) rotate(22)">
        <circle cx="0" cy="0" r="9" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
        <circle cx="0" cy="0" r="3.5" stroke="#2c2c2c" stroke-width="0.9" fill="none"/>
        <rect x="-2.5" y="-13" width="5" height="4.5" rx="1" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <rect x="-2.5" y="8.5" width="5" height="4.5" rx="1" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <rect x="8.5" y="-2.5" width="4.5" height="5" rx="1" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <rect x="-13" y="-2.5" width="4.5" height="5" rx="1" stroke="#2c2c2c" stroke-width="1" fill="none"/>
      </g>

      <!-- QUILL top-right area -->
      <g transform="translate(388,115) rotate(15)">
        <path d="M0,0 Q-6,-15 6,-35 Q18,-55 14,-30 Q10,-10 0,0Z" stroke="#2c2c2c" stroke-width="1.3" fill="none"/>
        <path d="M0,0 L-2,15" stroke="#2c2c2c" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M4,-14 Q0,-10 -4,-14" stroke="#2c2c2c" stroke-width="0.8" fill="none"/>
        <path d="M8,-22 Q4,-18 0,-22" stroke="#2c2c2c" stroke-width="0.8" fill="none"/>
      </g>

      <!-- Stars top strip -->
      <text x="95" y="35" font-size="15" fill="#b85c38" font-family="sans-serif">✦</text>
      <text x="272" y="30" font-size="10" fill="#2c2c2c" font-family="sans-serif">✧</text>
      <text x="395" y="42" font-size="9" fill="#2c2c2c" font-family="sans-serif">✧</text>

      <!-- ══ UPPER-MIDDLE (y 180–320) ══ -->

      <!-- UNICORN left -->
      <g transform="translate(62,250) scale(0.82)">
        <line x1="18" y1="-45" x2="36" y2="-78" stroke="#b85c38" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="23" y1="-52" x2="34" y2="-70" stroke="#b85c38" stroke-width="0.8"/>
        <path d="M5,-40 Q25,-55 38,-42 Q48,-30 42,-18 Q38,-8 28,-5 Q18,-3 10,-10 Q2,-18 5,-40Z" stroke="#2c2c2c" stroke-width="1.5" fill="none"/>
        <path d="M10,-40 Q14,-52 20,-46" stroke="#2c2c2c" stroke-width="1.2" fill="none"/>
        <circle cx="32" cy="-28" r="3" stroke="#2c2c2c" stroke-width="1.2" fill="none"/>
        <circle cx="32" cy="-28" r="1" fill="#2c2c2c" opacity="0.5"/>
        <path d="M10,-40 Q0,-30 5,-15 Q8,-5 12,0" stroke="#b85c38" stroke-width="1.3" fill="none"/>
        <path d="M8,-35 Q-3,-25 2,-12" stroke="#b85c38" stroke-width="0.9" fill="none" stroke-dasharray="2,2"/>
        <text x="40" y="-60" font-size="10" fill="#b85c38" font-family="sans-serif">✦</text>
        <text x="-2" y="-60" font-size="7" fill="#b85c38" font-family="sans-serif">✧</text>
      </g>

      <!-- HOURGLASS centre -->
      <g transform="translate(200,265)">
        <path d="M-14,-22 L14,-22 L4,0 L14,22 L-14,22 L-4,0 Z" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <line x1="-14" y1="-22" x2="14" y2="-22" stroke="#2c2c2c" stroke-width="1.4"/>
        <line x1="-14" y1="22" x2="14" y2="22" stroke="#2c2c2c" stroke-width="1.4"/>
        <path d="M-10,-20 Q0,-10 10,-20" stroke="#b85c38" stroke-width="1" fill="#b85c38" fill-opacity="0.2"/>
        <ellipse cx="0" cy="18" rx="8" ry="3" fill="#b85c38" fill-opacity="0.25" stroke="none"/>
      </g>

      <!-- KEY centre-right -->
      <g transform="translate(280,255) rotate(35)">
        <circle cx="0" cy="0" r="11" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <circle cx="0" cy="0" r="5" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
        <line x1="11" y1="0" x2="38" y2="0" stroke="#2c2c2c" stroke-width="1.4"/>
        <line x1="28" y1="0" x2="28" y2="7" stroke="#2c2c2c" stroke-width="1.4"/>
        <line x1="34" y1="0" x2="34" y2="5" stroke="#2c2c2c" stroke-width="1.4"/>
      </g>

      <!-- DRAGON right -->
      <g transform="translate(362,255) scale(0.88)">
        <path d="M0,0 Q-10,-20 -5,-35 Q5,-50 15,-40 Q25,-30 20,-15 Q15,0 0,0Z" stroke="#2c2c2c" stroke-width="1.5" fill="none"/>
        <path d="M15,-40 Q30,-55 40,-48 Q48,-40 45,-30 Q42,-20 35,-18 Q28,-16 22,-22 Q15,-28 15,-40Z" stroke="#2c2c2c" stroke-width="1.5" fill="none"/>
        <path d="M40,-30 Q52,-28 55,-22 Q52,-16 45,-18" stroke="#2c2c2c" stroke-width="1.3" fill="none"/>
        <ellipse cx="50" cy="-23" rx="2" ry="1.2" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <ellipse cx="36" cy="-36" rx="4" ry="3" stroke="#b85c38" stroke-width="1.2" fill="none"/>
        <ellipse cx="36" cy="-36" rx="1.5" ry="2" fill="#b85c38" opacity="0.5"/>
        <path d="M5,-35 L-2,-48" stroke="#2c2c2c" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M10,-38 L5,-52" stroke="#2c2c2c" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M15,-40 L12,-55" stroke="#2c2c2c" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M0,0 Q-20,-10 -35,5 Q-25,-5 -20,-20 Q-10,-25 0,0Z" stroke="#2c2c2c" stroke-width="1.3" fill="none"/>
        <line x1="-10" y1="-5" x2="-28" y2="0" stroke="#2c2c2c" stroke-width="0.8"/>
        <line x1="-5" y1="-12" x2="-30" y2="-8" stroke="#2c2c2c" stroke-width="0.8"/>
        <path d="M0,0 Q-8,14 -5,26 Q-2,36 5,30" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <path d="M55,-22 Q63,-17 59,-11 Q66,-14 63,-7 Q57,-1 51,-7" stroke="#b85c38" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      </g>

      <!-- CROWN -->
      <g transform="translate(390,200)">
        <path d="M-16,10 L-16,-6 L-6,4 L0,-14 L6,4 L16,-6 L16,10 Z" stroke="#b85c38" stroke-width="1.4" fill="none"/>
        <line x1="-16" y1="10" x2="16" y2="10" stroke="#b85c38" stroke-width="1.4"/>
        <circle cx="0" cy="-14" r="2" fill="#b85c38" opacity="0.5"/>
        <circle cx="-16" cy="-6" r="1.5" fill="#b85c38" opacity="0.4"/>
        <circle cx="16" cy="-6" r="1.5" fill="#b85c38" opacity="0.4"/>
      </g>

      <!-- Stars upper-middle -->
      <text x="156" y="190" font-size="17" fill="#b85c38" font-family="sans-serif">✦</text>
      <text x="318" y="185" font-size="10" fill="#2c2c2c" font-family="sans-serif">✧</text>

      <!-- ══ MIDDLE (y 340–560) ══ -->

      <!-- MUSHROOM left-centre -->
      <g transform="translate(138,420)">
        <rect x="-6" y="0" width="12" height="18" rx="2" stroke="#2c2c2c" stroke-width="1.3" fill="none"/>
        <path d="M-14,0 Q-10,-25 0,-28 Q10,-25 14,0Z" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <circle cx="-4" cy="-14" r="2.5" stroke="#b85c38" stroke-width="1" fill="none"/>
        <circle cx="5" cy="-18" r="2" stroke="#b85c38" stroke-width="1" fill="none"/>
        <circle cx="-1" cy="-24" r="1.5" stroke="#b85c38" stroke-width="1" fill="none"/>
      </g>

      <!-- CRYSTAL right-centre -->
      <g transform="translate(312,408)">
        <polygon points="0,-24 14,0 0,22 -14,0" stroke="#b85c38" stroke-width="1.4" fill="none"/>
        <line x1="-14" y1="0" x2="14" y2="0" stroke="#b85c38" stroke-width="0.8"/>
        <line x1="0" y1="-24" x2="14" y2="0" stroke="#b85c38" stroke-width="0.6" opacity="0.5"/>
        <line x1="0" y1="-24" x2="-14" y2="0" stroke="#b85c38" stroke-width="0.6" opacity="0.5"/>
      </g>

      <!-- FLOATING EYE centre -->
      <g transform="translate(218,455)">
        <path d="M-18,0 Q0,-14 18,0 Q0,14 -18,0Z" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <circle cx="0" cy="0" r="6" stroke="#2c2c2c" stroke-width="1.2" fill="none"/>
        <circle cx="0" cy="0" r="2.5" fill="#2c2c2c" opacity="0.4"/>
        <line x1="-12" y1="-7" x2="-9" y2="-4" stroke="#2c2c2c" stroke-width="0.9"/>
        <line x1="-4" y1="-11" x2="-3" y2="-7" stroke="#2c2c2c" stroke-width="0.9"/>
        <line x1="4" y1="-11" x2="3" y2="-7" stroke="#2c2c2c" stroke-width="0.9"/>
        <line x1="12" y1="-7" x2="9" y2="-4" stroke="#2c2c2c" stroke-width="0.9"/>
      </g>

      <!-- LIGHTNING BOLT left -->
      <g transform="translate(80,440)">
        <path d="M8,-22 L-2,-2 L6,-2 L-8,22" stroke="#b85c38" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- FEATHER far-left -->
      <g transform="translate(22,490) rotate(-15)">
        <path d="M0,0 Q0,-30 0,-50" stroke="#2c2c2c" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M0,-10 Q-12,-18 -8,-28 Q-2,-22 0,-10Z" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <path d="M0,-10 Q12,-18 8,-28 Q2,-22 0,-10Z" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <path d="M0,-26 Q-9,-34 -6,-43 Q-1,-37 0,-26Z" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <path d="M0,-26 Q9,-34 6,-43 Q1,-37 0,-26Z" stroke="#2c2c2c" stroke-width="1" fill="none"/>
      </g>

      <!-- BUTTERFLY far-right -->
      <g transform="translate(398,430)">
        <path d="M0,0 Q-18,-20 -22,-8 Q-20,6 0,0Z" stroke="#b85c38" stroke-width="1.2" fill="none"/>
        <path d="M0,0 Q18,-20 22,-8 Q20,6 0,0Z" stroke="#b85c38" stroke-width="1.2" fill="none"/>
        <path d="M0,0 Q-12,16 -10,24 Q-4,20 0,0Z" stroke="#b85c38" stroke-width="1.1" fill="none"/>
        <path d="M0,0 Q12,16 10,24 Q4,20 0,0Z" stroke="#b85c38" stroke-width="1.1" fill="none"/>
        <line x1="0" y1="-4" x2="-6" y2="-14" stroke="#2c2c2c" stroke-width="0.9"/>
        <line x1="0" y1="-4" x2="6" y2="-14" stroke="#2c2c2c" stroke-width="0.9"/>
      </g>

      <!-- SPIRAL centre-right -->
      <path d="M320,480 Q328,468 340,475 Q352,482 346,494 Q340,506 328,500" stroke="#2c2c2c" stroke-width="1.2" fill="none" stroke-linecap="round"/>

      <!-- Wavy doodle line left -->
      <path d="M25,530 Q38,520 51,530 Q64,540 77,530" stroke="#2c2c2c" stroke-width="1.1" fill="none" stroke-linecap="round"/>

      <!-- Stars middle -->
      <text x="25" y="362" font-size="11" fill="#b85c38" font-family="sans-serif">✦</text>
      <text x="392" y="355" font-size="9" fill="#2c2c2c" font-family="sans-serif">✧</text>
      <text x="260" y="540" font-size="13" fill="#b85c38" font-family="sans-serif">✦</text>

      <!-- ══ LOWER (y 560–750) ══ -->

      <!-- GEAR small bottom-left -->
      <g transform="translate(50,648)">
        <circle cx="0" cy="0" r="11" stroke="#2c2c2c" stroke-width="1.2" fill="none"/>
        <circle cx="0" cy="0" r="4.5" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <rect x="-3" y="-15" width="6" height="5" rx="1" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <rect x="-3" y="10" width="6" height="5" rx="1" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <rect x="10" y="-3" width="5" height="6" rx="1" stroke="#2c2c2c" stroke-width="1" fill="none"/>
        <rect x="-15" y="-3" width="5" height="6" rx="1" stroke="#2c2c2c" stroke-width="1" fill="none"/>
      </g>

      <!-- POTION BOTTLE -->
      <g transform="translate(162,648)">
        <rect x="-4" y="-28" width="8" height="6" rx="2" stroke="#2c2c2c" stroke-width="1.2" fill="none"/>
        <path d="M-4,-22 Q-10,-10 -12,4 Q-12,20 0,22 Q12,20 12,4 Q10,-10 4,-22Z" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <path d="M-11,8 Q-8,4 0,5 Q8,4 11,8" stroke="#b85c38" stroke-width="1.2" fill="#b85c38" fill-opacity="0.2"/>
        <circle cx="-3" cy="0" r="2" stroke="#b85c38" stroke-width="0.9" fill="none"/>
        <circle cx="4" cy="-5" r="1.5" stroke="#b85c38" stroke-width="0.9" fill="none"/>
      </g>

      <!-- PENCIL lower-centre, angled -->
      <g transform="translate(238,665) rotate(22)">
        <rect x="-3.5" y="-24" width="7" height="38" rx="1" stroke="#2c2c2c" stroke-width="1.3" fill="none"/>
        <polygon points="-3.5,14 3.5,14 0,22" stroke="#2c2c2c" stroke-width="1.1" fill="none"/>
        <line x1="-3.5" y1="8" x2="3.5" y2="8" stroke="#2c2c2c" stroke-width="0.9"/>
        <rect x="-3.5" y="-24" width="7" height="6" rx="1" stroke="#2c2c2c" stroke-width="1" fill="#2c2c2c" fill-opacity="0.12"/>
      </g>

      <!-- MAGNIFYING GLASS -->
      <g transform="translate(302,648) rotate(-20)">
        <circle cx="0" cy="0" r="14" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <line x1="10" y1="10" x2="24" y2="26" stroke="#2c2c2c" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="-7" y1="-7" x2="-3" y2="-3" stroke="#2c2c2c" stroke-width="0.8" opacity="0.4"/>
      </g>

      <!-- WALL CLOCK bottom-right -->
      <g transform="translate(372,648)">
        <circle cx="0" cy="0" r="20" stroke="#2c2c2c" stroke-width="1.4" fill="none"/>
        <line x1="0" y1="0" x2="0" y2="-13" stroke="#2c2c2c" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="10" y2="5" stroke="#2c2c2c" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="0" y1="-20" x2="0" y2="-16" stroke="#2c2c2c" stroke-width="1.3"/>
        <line x1="0" y1="16" x2="0" y2="20" stroke="#2c2c2c" stroke-width="1.3"/>
        <line x1="16" y1="0" x2="20" y2="0" stroke="#2c2c2c" stroke-width="1.3"/>
        <line x1="-20" y1="0" x2="-16" y2="0" stroke="#2c2c2c" stroke-width="1.3"/>
        <circle cx="0" cy="0" r="2" fill="#2c2c2c" opacity="0.5"/>
      </g>

      <!-- Stars lower -->
      <text x="132" y="575" font-size="9" fill="#2c2c2c" font-family="sans-serif">✧</text>
      <text x="392" y="588" font-size="11" fill="#b85c38" font-family="sans-serif">✦</text>
      <!-- Wavy line lower -->
      <path d="M258,730 Q271,720 284,730 Q297,740 310,730" stroke="#2c2c2c" stroke-width="1.1" fill="none" stroke-linecap="round"/>

      <!-- ══ BOTTOM STRIP (y 760–900) ══ -->

      <!-- Stars bottom -->
      <text x="62" y="790" font-size="9" fill="#2c2c2c" font-family="sans-serif">✧</text>
      <text x="192" y="810" font-size="14" fill="#b85c38" font-family="sans-serif">✦</text>
      <text x="118" y="840" font-size="9" fill="#2c2c2c" font-family="sans-serif">✧</text>
      <text x="340" y="825" font-size="10" fill="#2c2c2c" font-family="sans-serif">✦</text>
      <text x="395" y="860" font-size="8" fill="#b85c38" font-family="sans-serif">✧</text>

      <!-- Wavy doodle bottom -->
      <path d="M50,870 Q65,858 80,870 Q95,882 110,870" stroke="#2c2c2c" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <path d="M295,855 Q305,847 315,855" stroke="#2c2c2c" stroke-width="1" fill="none" stroke-linecap="round"/>

    </svg>
  </div>

  <!-- Screen: Home -->
  <div id="screen-home" class="screen active">
```

- [ ] **Step 2: Verify structure with static check**

```bash
python3 -c "
html = open('index.html').read()
checks = [
  ('id=\"wallpaper-layer\"', 'wallpaper div present'),
  ('preserveAspectRatio=\"xMidYMid slice\"', 'SVG responsive scaling'),
  ('viewBox=\"0 0 420 900\"', 'SVG viewBox'),
  ('id=\"screen-home\" class=\"screen active\"', 'home screen still present'),
]
for snippet, label in checks:
    assert snippet in html, f'MISSING: {label}'
    print(f'OK: {label}')

# Check wallpaper-layer comes before screen-home
wl = html.index('id=\"wallpaper-layer\"')
sh = html.index('id=\"screen-home\"')
assert wl < sh, 'FAIL: wallpaper-layer must come before screen-home'
print('OK: wallpaper-layer before screen-home')
print('All checks passed')
"
```

Expected:
```
OK: wallpaper div present
OK: SVG responsive scaling
OK: SVG viewBox
OK: home screen still present
OK: wallpaper-layer before screen-home
All checks passed
```

---

### Task 3: Update `showScreen()` to dim wallpaper on prompt screen

**Files:**
- Modify: `index.html` (JS `showScreen` function, around line 273)

- [ ] **Step 1: Add `classList.toggle('dimmed', ...)` to `showScreen`**

Find:
```js
    function showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt') {
        currentPrompt = null;
        lockedSlots = {};
      }
    }
```

Replace with:
```js
    function showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      document.getElementById('wallpaper-layer')
        .classList.toggle('dimmed', id === 'screen-imagine-prompt');
      if (id !== 'screen-just-draw' && id !== 'screen-imagine-prompt') {
        currentPrompt = null;
        lockedSlots = {};
      }
    }
```

- [ ] **Step 2: Verify with static check**

```bash
python3 -c "
js = open('index.html').read()
checks = [
  ('classList.toggle(\'dimmed\', id === \'screen-imagine-prompt\')', 'dimmed toggle'),
  ('document.getElementById(\'wallpaper-layer\')', 'wallpaper-layer reference'),
]
for snippet, label in checks:
    assert snippet in js, f'MISSING: {label}'
    print(f'OK: {label}')
print('All checks passed')
"
```

Expected:
```
OK: dimmed toggle
OK: wallpaper-layer reference
All checks passed
```

---

### Task 4: Manual browser verification

**Files:** none (browser testing only)

- [ ] **Step 1: Start local server**

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

- [ ] **Step 2: Verify wallpaper is visible on home screen**

The home screen should show the doodle objects scattered behind the "Drawing Prompt Lab" title and two buttons. Objects should be clearly visible but not overpower the text.

Check: wallpaper fills the full viewport edge-to-edge with no white gaps. Resize the browser window to a tall narrow shape (mobile portrait) and a wide short shape (landscape) — wallpaper should cover the full background in both.

- [ ] **Step 3: Verify opacity on all screens**

Navigate through every screen — Home, Mode Picker, Mutations Type, Just Draw, Imagination Prompt. On every screen **except** Imagination Prompt, the wallpaper should look the same (22% opacity). On the Imagination Prompt screen the wallpaper should visibly dim (12%). The transition between dimmed and full should animate smoothly (0.3s).

- [ ] **Step 4: Verify prompt words are legible at dimmed opacity**

On the Imagination Prompt screen, generate a Surreal Narrative prompt. The four word slots should be clearly readable with the dimmed wallpaper behind them. Lock one or two slots — the accent border and padlock icon should be crisp and unobstructed.

- [ ] **Step 5: Verify Just Draw screen is unaffected**

Go to Just Draw — the prompt text should render as plain text as before. No slot spans, no lock icons. Wallpaper at full 22% opacity (not dimmed — Just Draw uses `id === 'screen-just-draw'`, not `screen-imagine-prompt`).

- [ ] **Step 6: Verify landscape / mobile**

Use browser DevTools to set viewport to 375×667 (iPhone portrait) and 667×375 (landscape). In both orientations the wallpaper should fill the full background with no gaps. Objects will be partially cropped at edges — that's expected behaviour of `xMidYMid slice`.
