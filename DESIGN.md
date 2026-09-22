---
name: Minton Today
description: A welcoming Korean courtside magazine in the inherited Ohacle palette.
colors:
  ink: "#13426f"
  paper: "#f9f7f0"
  mint: "#dcecdf"
  mint-deep: "#b9d9c4"
  peach: "#f4e3d1"
  sky: "#d8ecfa"
  muted: "#5c6c74"
  line: "#d9ddd5"
  blue: "#267ac1"
  white: "#fffef9"
typography:
  display:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "49px"
    fontWeight: 800
    lineHeight: 1.23
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "26px"
    fontWeight: 750
    lineHeight: 1.4
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "-0.025em"
  reading:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 2.1
  wordmark:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: "-0.04em"
rounded:
  control: "7px"
  note: "8px"
  image: "12px"
  panel: "16px"
  pill: "100px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  generous: "30px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "13px 19px"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
  chip:
    rounded: "{rounded.pill}"
    padding: "7px 16px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
  card:
    textColor: "{colors.ink}"
  navigation:
    textColor: "{colors.ink}"
    height: "53px"
  briefing:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "25px 22px"
---

# Design System: Minton Today

## Overview

**Creative North Star: "The Courtside Weekend Magazine"**

Warm paper, navy lettering and gentle sport illustrations give Korean badminton reading a welcoming, precise rhythm. The inherited Ohacle cream, navy, mint and peach identity is the durable brand commitment.

This is a code-first implementation, without a separate visual comp. Strong Korean headlines sit beside quiet English editorial details; generous panels frame discovery while reading surfaces remain calm.

**Key Characteristics:**
- Warm, flat editorial surfaces.
- Strong Korean hierarchy and restrained English accents.
- Rounded imagery, fine rules and visible interaction states.

## Colors

The frontmatter records the implemented CSS palette; names below describe its roles.

### Primary
- **Courtside Navy (ink):** headings, navigation and primary actions.
- **Court Mint (mint):** feature and source panels; **Deep Mint (mint-deep)** supports selection.

### Secondary
- **Soft Peach (peach):** sample editorial notices.
- **Open Sky (sky):** the secondary editorial banner.
- **Action Blue (blue):** link hover, caret and keyboard focus.

### Neutral
- **Warm Paper (paper):** page canvas.
- **Milk White (white):** briefing and form surfaces.
- **Slate Grey (muted):** supporting copy and dates.
- **Quiet Sage (line):** borders and reading-list dividers.

## Typography

**Display and Body Font:** Noto Sans KR, with sans-serif fallback. **Wordmark and English Accents:** DM Sans, with sans-serif fallback. Both load through Google Fonts in the stylesheet.

The frontmatter hierarchy is the desktop baseline. Hero display grows to 54px on wide screens and uses `clamp(28px, 8.2vw, 34px)` on mobile. Article headlines move from 42px to 31px. Reading copy is limited to 72ch and changes to 15px with line-height 2 on mobile. Compact metadata remains intentionally quieter than story titles.

## Layout

The main container is capped at 1200px with 40px side gutters, widening to 1280px from 1500px. Gutters become 24px below 1050px and 18px below 760px. Desktop article collections use three columns; mobile uses two. Reading pages use a main column and sidebar, with the sidebar removed on mobile. Forms become single-column, navigation scrolls horizontally, and a dedicated mobile search link replaces the desktop search field.

Section spacing is generous, while related metadata is tightly grouped. Home composition is documented separately in `.impeccable/surface.md`.

## Elevation & Depth

No shadows are used. Flat color fields, thin borders and typographic contrast convey hierarchy. The hero raster uses multiply blending to sit within its mint field.

**The Paper Surface Rule.** Use tonal separation and fine rules for depth, consistent with the implemented shadow-free surfaces.

## Shapes

Panels use the largest recurring radius; image frames are slightly tighter, controls tighter again. Filter chips are pills. Circular arrow affordances, author marks and the tilted hero stamp provide small geometric accents.

## Components

### Buttons
Compact and confident. Primary buttons pair navy with paper; secondary buttons use a fine border. Primary hover darkens to `#215784` and rises 1px. Controls receive a 3px action-blue focus outline with 4px offset. Disabled buttons fade to 60% opacity.

### Chips
Outlined category links wrap when needed. Hover introduces mint; selection fills navy with white lettering. The selected state must remain distinct from hover.

### Cards / Containers
Article cards rest directly on paper with rounded illustration windows, category metadata, title, summary and byline. Briefing panels use milk white, a quiet border and spacious internal padding. Article art scales gently to 1.035 on hover over 400ms.

### Inputs / Fields
Milk-white fields use gently rounded borders, explicit labels and the shared focus treatment. Search groups outline as a whole on focus. Form errors use `#a03632`; status copy accompanies the color.

### Navigation
Fine navy rules frame the navigation. A 3px underline marks the active page. Mobile links remain in a horizontally scrollable row; the search link has a 44px square target.

### Editorial Imagery and Provenance
`public/logo.svg` is an authored vector feathered-M badminton mark. Article illustrations are authored inline SVG and Lucide vector icons in `components/site.tsx`.

`public/images/badminton.png` is copied from the user's existing Ohacle asset at `C:/project/ohacle/site/public/badminton.png`. Its original generation prompt is unavailable; this build did not generate the raster. Preserve that provenance when reusing it.

The hero reveals its image over 900ms with `cubic-bezier(.16,1,.3,1)`. Standard control transitions last 200ms. Reduced-motion preferences disable animations, transitions and smooth scrolling.

## Do's and Don'ts

### Do:
- **Do** preserve the inherited cream, navy, mint and peach identity.
- **Do** keep Korean headlines prominent and reading copy comfortably spaced.
- **Do** preserve visible keyboard focus and reduced-motion behavior.
- **Do** retain image provenance when reusing shipped assets.

### Don't:
- **Don't** replace the established badminton mark with an unrelated identity.
- **Don't** add shadows to the documented flat surface system without an intentional design revision.
- **Don't** present sample editorial drafts or reserved advertising space as live editorial or paid inventory.
