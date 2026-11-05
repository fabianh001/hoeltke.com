---
name: hoeltke.com — AI Weekly
description: A white-default publication with a retained dark theme and a working black terminal.
colors:
  bg: "#ffffff"
  panel: "#f7f7f7"
  line: "#e5e5e5"
  line-bright: "#a8a8a8"
  ink: "#181818"
  muted: "#5d5d5d"
  faint: "#666666"
  accent-vivid: "#333333"
  prompt: "#01a240"
  error: "#a03b35"
  warning: "#705a24"
  term-bg: "#050507"
  terminal-ink: "#f1f1f1"
  terminal-muted: "#a0a0a8"
  terminal-faint: "#9999a2"
  terminal-line: "#29292f"
  terminal-line-bright: "#55555e"
  terminal-raised: "#151518"
  terminal-error: "#f08a86"
  terminal-warning: "#d9a43b"
  dark-bg: "#000000"
  dark-panel: "#0a0a0d"
  dark-line: "#222228"
  dark-line-bright: "#3a3a42"
  dark-ink: "#ffffff"
  dark-muted: "#9a9aa2"
  dark-faint: "#888890"
  dark-accent: "#9050ff"
  dark-accent-vivid: "#7700ff"
  dark-green: "#3ef78f"
  dark-blue: "#0164ff"
typography:
  display:
    fontFamily: "OpenAI Sans, sans-serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "OpenAI Sans, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.025em"
  featured-title:
    fontFamily: "OpenAI Sans, sans-serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  title:
    fontFamily: "OpenAI Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 450
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  body:
    fontFamily: "OpenAI Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.75
  description:
    fontFamily: "OpenAI Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "OpenAI Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: "OpenAI Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  terminal:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "24px"
rounded:
  focus: "2px"
  chip: "7px"
  action: "14px"
  control: "6px"
  plate: "12px"
spacing:
  tight: "8px"
  snug: "12px"
  plate: "20px"
  gap: "24px"
  room: "28px"
  gutter-wide: "36px"
  newsletter: "64px"
  intro: "72px"
components:
  post-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "22px 0"
  post-row-hover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  terminal-plate:
    backgroundColor: "{colors.term-bg}"
    textColor: "{colors.terminal-ink}"
    typography: "{typography.terminal}"
    rounded: "{rounded.control}"
    padding: "24px"
  button-subscribe:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.action}"
    padding: "8px 16px"
    height: "44px"
  button-header:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    typography: "{typography.control}"
    rounded: "{rounded.action}"
    padding: "8px 16px"
    height: "44px"
  input-email:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "44px"
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.control}"
    height: "44px"
  tag-chip:
    backgroundColor: "transparent"
    textColor: "{colors.faint}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  reading-panel:
    backgroundColor: "color-mix(in srgb, #f7f7f7 50%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "20px"
---

# Design System: hoeltke.com — AI Weekly

## Overview

**Creative North Star: "Publication with a working terminal"**

A restrained publication with white paper, dark ink, gray supporting text, thin rules, and a working black console. The white theme is the default even on a dark operating system. A footer switch retains the original black, purple, and neon-green theme as an explicit reader choice.

The publication remains digest-first. OpenAI Sans carries reading, identity, metadata, and controls; JetBrains Mono belongs to actual console surfaces. The existing introduction-and-post-index composition, Home / Terminal routes, content, and interactions survive the style rollout. Surface-specific composition is recorded in `.impeccable/surfaces/production-theme.md`.

**Key Characteristics:**
- White-default reading surfaces with restrained gray metadata and ink controls.
- Green dollar prompts and pulsing status dots; adjacent status words remain gray.
- An optional retained dark palette and an independently black terminal.
- OpenAI Sans reading and navigation; JetBrains Mono console text.
- Thin rules, wide desktop gutters, responsive stacking, and native route links.

## Colors

The default palette is neutral paper and ink with a narrowly placed green signal. Frontmatter records light primitives, independent console primitives, and the retained dark variants; `global.css` owns the theme assignment.

### Primary
- **Prompt Green** (`{colors.prompt}`): Dollar prompts and status dots in the light theme. It is also the source's status-green value; it does not color surrounding status text or ordinary light-theme controls.

### Secondary
- **Electric Violet / Voltage Purple** (`{colors.dark-accent}`, `{colors.dark-accent-vivid}`): Retained dark-theme interaction, focus, and legacy colored edges.
- **Phosphor Green / Signal Blue** (`{colors.dark-green}`, `{colors.dark-blue}`): Retained dark-theme actions and legacy edge vocabulary. This exception belongs to the explicitly retained dark theme.

### Neutral
- **Paper / Panel** (`{colors.bg}`, `{colors.panel}`): Light page canvas and tonal containers.
- **Ink / Muted / Faint** (`{colors.ink}`, `{colors.muted}`, `{colors.faint}`): Reading, supporting information, and quieter metadata. Light accent and ordinary green/blue utility roles resolve to ink.
- **Hairline / Strong Boundary** (`{colors.line}`, `{colors.line-bright}`): Rules and control outlines.
- **Void / Dark Graphite** (`{colors.dark-bg}`, `{colors.dark-panel}`): Retained dark page and panel grounds, with their dark ink, metadata, and boundary variants.
- **Console Black and Console Ink** (`{colors.term-bg}`, `{colors.terminal-ink}`): Fixed console contrast in either page theme. Dedicated console muted, faint, boundary, raised, warning, and error tokens prevent page-theme leakage.
- **Error / Warning** (`{colors.error}`, `{colors.warning}`): Semantic feedback in light reading surfaces; consoles and the dark theme use their own brighter variants.

### Named Rules
**The Green Signal Rule.** On the light website, green is reserved for dollar prompts and status dots; reading, controls, and adjacent status words use neutral ink or gray.

**The Independent Console Rule.** Console backgrounds, text, errors, and boundaries stay on dedicated terminal tokens in either page theme; never use terminal black for an email reading card.

## Typography

**Display Font:** OpenAI Sans, sans-serif.
**Body Font:** OpenAI Sans, sans-serif.
**Label/Mono Font:** OpenAI Sans for reading labels; JetBrains Mono Variable with ui-monospace, SF Mono, monospace fallbacks for actual consoles.

OpenAI Sans is self-hosted in regular, medium, semibold, and bold files. JetBrains Mono is self-hosted through Fontsource for the web console. The historical `font-mono` utility now resolves to OpenAI Sans on reading surfaces; the console explicitly overrides it. The observed title weight of 450 remains in source, although the supplied Sans files are static; it is not a new variable-font scale.

### Hierarchy
- **Display:** Introduction heading; 28px on narrow screens.
- **Headline:** Digest article h1; 30px/36px below the small breakpoint.
- **Featured title:** Lead post title; 21px at the mobile layout breakpoint.
- **Title:** Standard post title; line-height reduces to 1.45 on mobile.
- **Body:** Article prose uses the body token. Intro copy has 1.6 line-height and reduces to 17px on mobile, with a 30ch desktop and 35ch mobile measure.
- **Description:** Post summaries and disclosure use the final 16px override across viewports. Author and newsletter supporting copy remain 14px.
- **Label:** Dates, reading times, and bylines use the final 13px override and tabular numerals. Footer remains 11px; index headings and terminal shortcut hints remain 12px.
- **Control:** Navigation and email controls use the control token; mobile route labels are 13px and the header action is 12px.
- **Terminal:** Transcript uses the terminal token, including the terminal-route mobile override; command buttons remain 12px. The about transcript uses 14px with 28px line-height.

### Named Rules
**The Reading and Console Rule.** Use OpenAI Sans for publication and shell UI; reserve JetBrains Mono for actual console material. Preserve email's existing mono brand/metadata fallback as an email-specific treatment.

## Layout

The wide shell centers at 1440px with 36px side gutters; header, content, and footer share alignment. Reading pages retain a 48rem shell with 20px gutters and 80px bottom padding; the digest article itself is limited to 680px. The desktop header has a 1fr / 2fr / 1fr grid and a 95px minimum height.

The existing home and terminal composition pairs an introduction with content in a 1 / 2.6667 grid, an 8.3333% gap, and 72px top padding. Ruled post rows use date / title / reading-time columns with 24px gaps and 22px vertical padding; featured rows use 28px. The newsletter follows after 64px with 28px top padding and a rule. These are retained surface geometry, not a mandate for unrelated future pages.

At 1050px the two-column ratio becomes 1 / 2.5 with a 48px gap; row metadata moves above the full-width title. At 760px gutters become 20px, the intro precedes content, top padding and content gap become 36px, and all post rows use 20px vertical padding. The header stacks into two rows with visible route links and a 116px minimum height. The newsletter margin reduces to 44px. Later typography overrides retain 13px metadata and 16px descriptions on mobile.

The default page background is plain. The terminal route opts into the 28px dot grid and pointer-follow spotlight with a 140px radius; the spotlight is hidden for no-hover devices and reduced motion and cannot intercept input. Shrinking fields and long wrapping titles preserve narrow layouts. Core shell, subscription, switch, and terminal command controls have a 44px minimum target height.

## Elevation & Depth

Publication content is flat: one-pixel neutral rules and panel-toned hover establish hierarchy. The terminal has a soft downward shadow, light on paper and stronger on dark, without the former purple halo. The popover is a solid panel with a bright border and transparent backdrop. Console glow resolves to transparent; CRT vignette is disabled. Legacy digest cards retain their scoped hover/lift implementation and do not define current index depth.

### Shadow Vocabulary
- **Light terminal float:** `0 18px 48px rgba(24, 24, 24, 0.08)`.
- **Dark terminal float:** `0 18px 48px rgba(0, 0, 0, 0.65)`.

### Named Rules
**The Hairline Rule.** Separate publication content with a one-pixel neutral rule and tonal hover before introducing depth effects.

## Shapes

Post rows are square and flat. Action buttons use the action radius (14px), with compact labels using the chip radius (7px), inspired by Twelve Labs. Inputs, popover, and the terminal route retain the control radius. Article sources, subscription panels, about transcript, travel tiles, and retained legacy cards use the plate radius. Circular status/chrome dots and the rounded footer switch remain functional details. The switch track is 32px by 18px with a 14px thumb; its dark state translates the thumb by 14px.

The console caret is a 0.6em by 1.15em block in console ink. Console chrome uses neutral dots. Rounded keyboard outlines follow the focus radius.

## Components

### Navigation
Native Home / Terminal anchors use Sans, muted resting text, and ink with a themed bottom rule for the current route. Hover and focus use the theme accent; transitions are 150ms ease-out. Stable accessible labels accompany decorative shortcut labels. The bounded 420ms scramble resolves left to right, cancels on leave/blur, and is disabled for reduced motion. H / T shortcuts avoid editing controls, modifier combinations, repeats, and composition. Escape from the terminal prompt focuses the Terminal route link. Mobile routes remain visible on the second row.

### Post Rows
Flat ruled links pair gray metadata with Sans titles. Hover adds panel fill, themed title color, and a one-pixel underline offset by 4px. Featured rows add a summary and source-count byline. Home and archive are server-rendered Astro surfaces.

### Buttons
Light subscription and header actions use ink fill and paper text. Subscription hover reduces opacity to 90%; header hover uses the deeper neutral. Dark subscription retains neon green with black text, and the dark header retains its graphite fill, bright boundary, and violet hover. Console command buttons stay transparent with console text and boundaries. Keyboard focus remains visible.

### Inputs / Fields
Email fields use the page canvas, bright one-pixel boundary, control radius, and 8px/12px padding; focus uses the current accent boundary. Publication and popover fields shrink and retain 44px minimum height. Terminal input and terminal subscription use the fixed console palette, with transparent fields and visible local focus feedback. Errors use the appropriate page or console error token.

### Theme Switch
The footer button has role switch, the stable label Dark mode, and aria-checked reflecting selection. Light is the deliberate default, independent of OS preference. A head bootstrap applies a saved dark choice before paint; localStorage key `hoeltke-theme` persists the preference and storage events synchronize tabs. The original black/green/purple favicon is fixed across themes. Storage failures remain usable in-session. The switch stays hidden without JavaScript; default reading and native routes remain usable.

### Terminal Plate
The real React terminal keeps server-rendered welcome content, commands, completion, and history. It is always console black with JetBrains Mono, dedicated console ink/muted/boundary/error tokens, neutral chrome dots, and green dollar prompts. The transcript has 420px minimum height and 24px padding, reducing to 340px and 18px on mobile. Fine-pointer desktop retains a 34rem internal scroll limit. At 760px or on coarse pointers it expands into document scrolling. Empty Tab/Shift+Tab preserve native escape; Escape focuses route navigation. The shortcut hint below the plate uses Sans, 12px/1.7, and a 16px top margin.

Cursor blink remains 1.1s steps(1). The status dot keeps the original 2.4s ease-out pulse with a 5px transparent expansion; words beside it remain muted. Reduced motion disables both animations, legacy rise, and the moving spotlight, and collapses other transition durations. The retained legacy rise uses 550ms and 14px travel.

### Audio Player
Article audio remains a separate React island with play/pause, keyboard-operable scrubber, ten-second skips, speed control, and loading/error states. It follows the page theme, using ink controls in light mode and the retained dark actions when selected.

### Cards / Containers
Reading sources and subscription panels retain neutral borders, softly rounded corners, panel tint, and 20–28px padding. Travel and about retain their existing geometry. Current home/archive lists use ruled PostRows. Existing DigestCard retains its scoped edge cycle and hover lift, but does not govern the current index.

### Chips
Article tags retain compact one-pixel boundaries, chip radius, 2px/6px padding, and theme-aware quiet text.

### Email and Share Images
Emails derive the default root colors through `themeTokens`, with near-white/near-black email-safe substitutions. Both wrapper and reading card use page background, never terminal background. Email Sans reading has robust fallbacks; existing mono brand and metadata remain email-specific. Share images use the default white, dark ink, gray description, and self-hosted OpenAI Sans regardless of a browser's saved theme.

### Focus Ring
Keyboard links and controls use a two-pixel theme-accent outline with a two-pixel offset; email fields use their explicit focus boundary. Console focus resolves against its own dark surface.

## Do's and Don'ts

### Do:
- **Do** start reading surfaces in white and preserve the reader's explicit dark-theme choice.
- **Do** keep light-theme green on dollar prompts and status dots, with gray status words.
- **Do** use OpenAI Sans for reading and navigation, and JetBrains Mono for console surfaces.
- **Do** keep console tokens independent from the page theme and email card background.
- **Do** preserve native routes, server-rendered content, visible focus, responsive wrapping, and reduced motion.

### Don't:
- **Don't** choose dark mode from the operating system or expose a nonfunctional no-JavaScript switch.
- **Don't** spread dark-theme neon controls into the light theme.
- **Don't** add the terminal dot grid or legacy card stack to the publication index.
- **Don't** extend uppercase tracked eyebrows or glyph interface icons into new surfaces.
- **Don't** trap keyboard navigation or remove working audio, subscription, terminal, and reading flows.

Not canonized or repaired: the article source heading retains an uppercase tracked eyebrow; inherited arrow/check/emoji decorations remain in scoped copy, and the 450 title weight has no matching supplied static Sans face. These are pre-existing craft or implementation drift, not new reusable rules; this documentation pass does not change UI.
