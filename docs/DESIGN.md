# DESIGN SYSTEM SPECIFICATION: ANARCHIC PRECISION

## 1. Overview & Creative North Star
The Creative North Star for this system is **"The High-Voltage Underground."** 

We are moving away from the "friendly" corporate SaaS aesthetic and leaning into the raw, visceral energy of 90s warehouse rave posters and brutalist editorial design. This design system rejects the safety of the grid in favor of tension, impact, and "organized chaos." We achieve a premium feel not through softness, but through extreme intentionality: razor-sharp edges, massive typographic scale, and a "red-out" color immersion that feels both aggressive and expensive.

The goal is to make the user feel like they are stepping into an exclusive, high-stakes event. Every element should feel like it was slashed onto the screen with purpose.

---

## 2. Colors & Surface Logic
The palette is dominated by a deep, vibrating red, punctuated by "Vantablack" levels of darkness and clinical white highlights.

*   **Primary Palette:** 
    *   `surface`: #270000 (The "Blood-Dark" base)
    *   `tertiary_container`: #FE0000 (The "High-Voltage" Red)
    *   `on_tertiary_container`: #000000 (The "Heavy Black")
*   **The "No-Line" Rule:** Under no circumstances are 1px solid borders to be used for sectioning. Definition must be achieved through **Tonal Blocking**. A `surface-container-high` (#490000) element sitting on a `surface` (#270000) background provides all the separation required. If a boundary feels "mushy," increase the contrast of the background block rather than adding a stroke.
*   **Signature Textures:** For high-impact areas like main CTAs or the "Active Player" card, use a subtle linear gradient from `tertiary` (#FF725E) to `tertiary_container` (#FE0000) at a 135-degree angle. This adds a "lithographic" depth that prevents the brutalism from feeling flat or "cheap."
*   **The Glass Rule:** For floating modals or overlays, use `surface_bright` (#600000) at 80% opacity with a `24px` backdrop-blur. This creates a "smoldering glass" effect that allows the chaotic red energy to bleed through the UI layers.

---

## 3. Typography
Typography is the primary architecture of this system. We use a "Wide vs. Clinical" hierarchy.

*   **Display & Headlines (Archivo Black):** These must be used aggressively. `display-lg` (3.5rem) should be set with tight letter-spacing (-0.05em) to create a "wall of text" effect. This is our "aggressive" voice.
*   **Body & UI (Inter):** Used for gameplay instructions and data. It provides the "Clinical" counter-balance to the chaos.
*   **Hierarchy as Identity:** 
    *   **Captions:** Use `label-sm` in all-caps with +0.1em letter spacing.
    *   **Contrast:** Never place medium-sized text near large-sized text. Use extreme jumps (e.g., a `display-lg` title immediately followed by `body-sm` metadata) to create a signature editorial look.

---

## 4. Elevation & Depth
Traditional drop shadows are forbidden. We use **Tonal Layering** and **Ambient Glows**.

*   **The Layering Principle:** Depth is achieved by "stacking" the surface-container tiers. 
    *   Level 0: `surface` (Background)
    *   Level 1: `surface-container-low` (Content areas)
    *   Level 2: `surface-container-highest` (Interactive cards)
*   **Ambient Shadows:** If a floating element (like a buzzer) requires a shadow, it must use the `on_surface` color at 8% opacity with a 64px blur and 0px offset. It should look like an atmospheric glow, not a shadow.
*   **Ghost Borders:** If accessibility requires a border, use the `outline-variant` (#950100) at 20% opacity. It should be felt, not seen.

---

## 5. Components & Shape Language
All `border-radius` tokens are set to **0px**. The shape language is defined by **Slashed Geometry**.

*   **Buttons:** 
    *   **Primary:** `tertiary_container` background with `on_tertiary_container` (Black) text. 0px radius. Use a 4px offset "hard shadow" of the same color to create a 3D block effect.
    *   **Secondary:** Ghost style. No background, `primary` text, with a `primary` 2px bottom-bar only.
*   **Irregular Containers:** For game-state panels (e.g., "Round 1"), use CSS `clip-path` to create "sheared" edges (e.g., a 5-degree tilt on the right side). Avoid rectangles wherever possible; use trapezoids and "slashed" boxes to maintain the underground poster vibe.
*   **Input Fields:** Use `surface_container_lowest` (#000000) for the field background. The active state is indicated by a 4px `outline` (#EC0000) "bracket" that only appears on the left and right sides of the input.
*   **Cards:** No dividers. Separate content using `spacing-8` (1.75rem) vertical gaps. If content needs grouping, use a slightly different red-tone background from the `surface-container` scale.
*   **The "Jeparty" Buzzer:** A high-impact component using a radial gradient of `tertiary` and `error` (#FF6E84). It should appear as a sharp-edged circle or a skewed diamond to break the otherwise rectilinear layout.

---

## 6. Do’s and Don’ts

### DO:
*   **DO** overlap elements. Let a heading bleed over the edge of a container.
*   **DO** use extreme white space. Use `spacing-24` (5.5rem) to separate major sections.
*   **DO** use "Heavy Black" (#000000) for high-contrast text on red backgrounds.
*   **DO** treat the UI as a poster. If it looks too much like a "website," break a margin.

### DON’T:
*   **DON’T** use rounded corners (0px is the law).
*   **DON’T** use 1px borders or dividers. They clutter the brutalist vision.
*   **DON’T** use "Safety Blue" or "Success Green." Use the `error` and `tertiary` scales for all feedback—keep the palette restricted and intense.
*   **DON’T** center-align everything. Use strong left-aligned "anchor lines" to create a modern, editorial structure.