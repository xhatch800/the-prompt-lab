# Project Overview

- **Name:** Drawing Prompt Lab
- **Goal:** Provide on-demand drawing inspiration offering different modes (observation or imagination)
- **Audience:**  Artists who seek to improve their drawing skills.
- **Platform:** Web-based, optimized for both mobile browsers.
- **Hosting:** GitHub Pages (Static)

# Functional Requirements

* The user can pick from the following modes:
	* "Just draw!"
	* "Can you imagine..."
* When the user picks "Just draw!" mode:
	* The app picks one of the prompts from  [[drawing-prompt-lab-requirements.md]]
	* Its straight up don't think too much, and just draw whatever the prompt says.
* When the user picks "Can you imagine..." mode:
	* Two options can be selected
		* Surreal Narrative - Random Adjective, Noun, Verbing and Environment (melancholic + hamster + gardening + underwater)
		* Mutations - Random combinations of either organic + organic (chimera), organic + synthetic (biomechanical), or synthetic + synthetic (surreal object)

# UX & Interaction Design

## Screen Flow

The app has four screens. Only one is visible at a time, with a CSS fade transition (~200ms) between screens.

```
[ Home ]
  "Just draw!" ──────────────────→ [ Just Draw Prompt ]
  "Can you imagine..." ──────────→ [ Imagination Mode Picker ]
                                        "Surreal Narrative" ──→ [ Imagination Prompt ]
                                        "Mutations" ───────────→ [ Imagination Prompt ]
```

- All non-home screens have a **← back** button.
  - "Just Draw Prompt" back → Home
  - "Surreal Narrative" / "Mutations" back → Imagination Mode Picker
- All prompt screens (Just Draw, Surreal Narrative, Mutations) have a **↺ regenerate** button to get a new prompt without leaving the screen.
- Mode selection uses a **landing/home screen** (not persistent tabs). The user commits to a mode; switching requires going back to Home.

## Prompt Output Format

- **Just Draw:** displays the prompt string as-is (e.g. *"Draw a shoe"*)
- **Surreal Narrative:** displays as `[adjective] [noun] [verb] [environment]` (e.g. *"melancholic hamster gardening underwater"*)
- **Mutations:** displays as `[noun1] + [noun2]` — no category label (chimera/biomechanical/surreal object labels are not shown)

# Visual Design

- **Aesthetic:** Light, hand-drawn / sketchbook feel
- **Background:** Off-white cream (`#fdf8f0`)
- **Font:** `Caveat` (Google Fonts) — used for all text: headings, prompts, buttons
- **Text color:** Ink dark (`#2c2c2c`)
- **Buttons:** Rounded rectangles with a subtle offset box-shadow for a hand-drawn border feel
- **Prompt text:** Large, centered, generous line-height — the prompt is the hero of the screen
- **Accent color:** One muted warm accent (e.g. `#b85c38`) used for the regenerate button and active states
- **No images or textures** — handmade feel comes from font and spacing alone
- **Mobile-first sizing:** Prompt text ~1.8–2.2rem on mobile; buttons sized for thumb reach

# Architecture & Data Structure

The application will follow a decoupled structure to ensure ease of content maintenance.

## File System

- `index.html`: Contains HTML structure, CSS (embedded), and JS logic.
- Data Files:
	- Used in "Just Draw!" mode:
		- `/data/just_draw.json`: Array of strings [[Prompts List - Everyday Matters]]
	- Used in "Can you imagine..." mode:
		- `/data/verbs.json` - Array of strings (verbs ending with "ing"). 
		- `/data/adjectives.json` - Adjectives
		- `/data/nouns_organic.json`: Array of strings (Creatures, plants, beings, people).
		- `/data/nouns_synthetic.json`: Array of strings (Tools, objects, structures)    
		- `/data/environments.json`: Array of strings (Settings, lighting, or conditions).

## Data Fetching

- All six JSON files are fetched in parallel via `Promise.all` on page initialization.
- Data is held in memory for the session — no re-fetching between prompts.
- **Error Handling:** If any file fails to load (or returns an empty array), mode buttons are disabled and the Home screen displays a clear error banner: *"Couldn't load prompt data — try refreshing."*

## Prompt Generation Logic

- **Just Draw:** pick one random item from `just_draw.json`
- **Surreal Narrative:** pick one random item each from adjectives, one noun (organic or synthetic, chosen at random), verbs, and environments
- **Mutations:** randomly pick a combination type (organic+organic, organic+synthetic, or synthetic+synthetic), then pick one item from each relevant list

## Starter Data

All data files ship with seed content:
- `just_draw.json` — populated from [[Prompts List - Everyday Matters]] (328 prompts)
- All other files — ~50–100 entries each generated as reasonable seed content

## Technical Constraints

- **Implement as static page in GitHub Pages**
- **No Dependencies:** No external libraries (jQuery, React, etc.) or CSS frameworks (Bootstrap). Use vanilla JS and CSS.
- **No build step:** Files are served as-is — no bundler or compilation required.
- **CORS Awareness:** Since the app uses `fetch`, local development will require a local server (e.g. `python3 -m http.server` or VS Code Live Server) to bypass security restrictions before deployment to GitHub.
- **State:** The app does not need to persist data between sessions, but it should retain the user's selected mode during the current session (JS variables, no localStorage).
