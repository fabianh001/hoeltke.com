---
name: hoeltke.com — AI Weekly
description: A dark publication with mono wayfinding, sans reading titles, and a working terminal.
colors:
  bg: "#000000"
  term-bg: "#050507"
  panel: "#0a0a0d"
  line: "#222228"
  line-bright: "#3a3a42"
  ink: "#ffffff"
  muted: "#9a9aa2"
  faint: "#5f5f67"
  accent: "#9050ff"
  accent-vivid: "#7700ff"
  prompt: "#3ef78f"
  blue: "#0164ff"
  amber: "#d9a43b"
  red: "#d33043"
  glow: "rgba(119, 0, 255, 0.35)"
typography:
  display:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  featured-title:
    fontFamily: "Inter Variable, system-ui, -apple-system, sans-serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter Variable, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 450
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter Variable, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  description:
    fontFamily: "Inter Variable, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
  terminal:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
rounded:
  hairline: "2px"
  chip: "4px"
  control: "6px"
  plate: "12px"
  dot: "9999px"
spacing:
  tight: "8px"
  snug: "12px"
  gap: "24px"
  plate: "20px"
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
    textColor: "{colors.accent}"
  terminal-plate:
    backgroundColor: "{colors.term-bg}"
    textColor: "{colors.ink}"
    typography: "{typography.terminal}"
    rounded: "{rounded.control}"
    padding: "24px"
  button-subscribe:
    backgroundColor: "{colors.prompt}"
    textColor: "{colors.bg}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  button-header:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.chip}"
    padding: "8px 16px"
    height: "44px"
  button-command:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "2px 14px"
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
  nav-link-active:
    textColor: "{colors.ink}"
  tag-chip-legacy:
    backgroundColor: "transparent"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  digest-card-legacy:
    backgroundColor: "color-mix(in srgb, #0a0a0d 70%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "20px"
---

# Design System: hoeltke.com — AI Weekly

## Overview

**Creative North Star: "Dark Publication"**

A restrained publication on pure black, with bright ink, muted metadata, thin rules, and purple interaction. The retained black/purple/green palette is a confirmed identity commitment. Monospace identifies the site and orients the reader; sans titles and summaries make the writing approachable.

The terminal keeps the same identity with command output and CRT chrome. Older reading, about, and travel surfaces retain rounded containers and some glow; those are scoped incumbent treatments, not a requirement for every new surface. The publication index uses flat ruled rows and the default shell has no dotted background.

**Key Characteristics:**
- Pure black ground, white ink, and muted gray metadata.
- Purple interaction and green prompts, status, and subscription confirmation.
- JetBrains Mono wayfinding paired with Inter publication titles and prose.
- Thin rules, generous desktop gutters, and a stacked mobile reading order.
- A real terminal with restrained chrome; retained legacy containers stay scoped.

## Colors

The palette couples a neutral black foundation with electric violet and phosphor green. Frontmatter retains the source's existing color keys; prompt and green are source aliases for the same color.

### Primary
- **Electric Violet** (`{colors.accent}`): Active route underline, hover text, links, input focus, and keyboard outlines.
- **Voltage Purple** (`{colors.accent-vivid}`): Retained colored card edges and the hue behind legacy glow.

### Secondary
- **Phosphor Green** (`{colors.prompt}`): Brand prompt, terminal commands and caret, operational status, subscription buttons, and success messages.

### Tertiary
- **Signal Blue** (`{colors.blue}`): Retained digest-card edge cycle.
- **Terminal Amber** (`{colors.amber}`): Terminal chrome and playful command responses.
- **Alert Red** (`{colors.red}`): Terminal errors and chrome.

### Neutral
- **Void** (`{colors.bg}`): Page canvas and text on green buttons.
- **Plate Black** (`{colors.term-bg}`): Terminal transcript surface.
- **Panel Graphite** (`{colors.panel}`): Row hover, popover, and retained containers.
- **Hairline / Hairline Bright** (`{colors.line}`, `{colors.line-bright}`): Dividers and control boundaries.
- **Ink / Muted** (`{colors.ink}`, `{colors.muted}`): Primary reading and secondary information.
- **Faint** (`{colors.faint}`): Retained decorative terminal material; existing informational uses are drift, not a recommended text role.
- **Purple Glow** (`{colors.glow}`): Retained about/card lighting, absent from the publication index and overridden on the current terminal route.

### Named Rules
**The Faint Floor Rule.** Informational dates, counts, tags, and instructions use muted or brighter text; inherited faint informational text is not a rule to extend.

## Typography

**Display Font:** JetBrains Mono Variable, with ui-monospace, SF Mono, monospace fallbacks.
**Body Font:** Inter Variable, with system-ui, -apple-system, sans-serif fallbacks.
**Label/Mono Font:** JetBrains Mono Variable.

Both faces are self-hosted through Fontsource. Mono supplies identity and structured metadata; Inter carries publication titles, descriptions, and article prose. There is no continuous or invented type scale: roles use the discrete sizes observed in the implementation.

### Hierarchy
- **Display:** Intro headings use the display token, reducing to 28px at the mobile layout breakpoint.
- **Headline:** Existing article h1s retain the mono headline token; prose headings remain mono.
- **Featured title:** The lead post uses the featured-title token, reducing to 21px on mobile.
- **Title:** Standard row titles use the title token, with 1.45 line-height on mobile.
- **Body:** Intro copy uses the body token, reducing to 17px on mobile; its measure is 30ch desktop and 35ch mobile.
- **Description:** Post summaries and disclosure use the description token; mobile disclosure reduces to 13px.
- **Terminal:** Transcript line-height stays 24px. Its source uses 16px below 640px and 14px above; the terminal-route mobile override also makes it 14px through 760px.
- **Label:** Date and read-time metadata use the label token and tabular numerals, reducing to 11px on mobile. Bylines and footer are 11px.
- **Controls:** Header navigation and email controls use the control token. Mobile tabs are 13px, and the header button is 12px.

### Named Rules
**The Two Type Roles Rule.** Use mono for identity, navigation, metadata, and terminal output; use Inter for publication row titles and explanatory prose. Existing mono article headings remain valid in their reading context.

## Layout

The wide shell centers at 1440px with 36px side gutters; header and footer share that alignment. Reading pages retain a 48rem main container with 20px gutters and 80px bottom padding. The desktop header uses a 1fr / 2fr / 1fr grid and a 95px minimum height.

The publication and terminal routes pair an introduction with content in a 1 / 2.6667 grid separated by an 8.3333% gutter. Main content starts 72px below the header. Rows use date / title / reading-time columns, 24px gaps, 22px vertical padding, and 28px for the featured row. The newsletter follows after 64px with a ruled top edge.

At 1050px the introduction/content ratio becomes 1 / 2.5 with a 48px gap. Each post moves date and reading time above a full-width title. At 760px the outer gutters become 20px, the intro precedes content, the content gap and top padding become 36px, and rows use 20px vertical padding. The header becomes two rows with both route links visible and a 116px minimum height. The newsletter gap reduces to 44px.

The default layout has a plain background. Only /terminal/ opts into the 28px dot grid and cursor-follow spotlight, revealed within a 140px radius behind the pointer. The moving spotlight is hidden on touch/no-hover devices and for reduced motion; content stays above the effect and the overlay cannot intercept input. Fields and content columns permit shrinking; long post titles wrap anywhere. Interactive route links, header controls, publication subscribe controls, and terminal command buttons have a 44px minimum height.

## Elevation & Depth

The publication index is flat: one-pixel rules and a panel-toned hover convey hierarchy. The terminal window has a soft downward shadow and a restrained purple ambient halo, lifting it from its dot-grid background. The popover is a solid panel with a bright border and transparent backdrop. Existing about and legacy digest-card treatments still use zero-offset purple bloom; they are retained scope, not default publication depth.

### Shadow Vocabulary
- **About bloom:** `0 0 40px var(--glow)` on the about transcript.
- **Legacy card hover bloom:** `0 0 24px var(--glow)` with a 2px lift, only in the retained DigestCard component.
- **Terminal float:** `0 18px 48px rgba(0, 0, 0, 0.65), 0 0 36px rgba(119, 0, 255, 0.14)` replaces the inherited 50px bloom on /terminal/.

### Named Rules
**The Hairline Rule.** Separate publication content with a one-pixel neutral rule and tonal hover before adding depth effects.

## Shapes

Publication rows have square edges. Header Subscribe uses the chip radius; the popover, terminal route, inputs, and command buttons use the control radius. Existing article callouts, sources, about transcript, travel tiles, and legacy cards retain the plate radius. Chrome/status dots are circular; keyboard outlines round at the hairline radius.

The terminal block caret is 0.6em wide and 1.15em tall. CRT scanlines and a radial vignette remain scoped to the terminal's clipped surface.

## Components

### Navigation
Persistent Home / Terminal route anchors use mono, muted resting text, and ink plus a purple bottom rule for aria-current. Hover and visible keyboard focus turn both the label and its [H]/[T] shortcut purple over 150ms ease-out. The green prompt in the brand is textual shell identity. Mobile navigation remains visible on a second row. Route changes use native history and work without React or a client router.

Hover or focus starts a bounded 420ms character scramble, resolving the label progressively from left to right. The decorative glyph set is #[]/:;=+*_; it is animated text, not an interface icon. Pointer leave or blur cancels the pending frame and restores the original label. Reduced motion keeps the label stable. Labels preserve whitespace, and aria-hidden visual spans pair with stable Home / Terminal aria-labels and H / T aria-keyshortcuts.

Case-insensitive H and T shortcuts navigate to the native route targets. They do not run while editing input, textarea, select, contenteditable, textbox, or combobox content, or during Ctrl/Alt/Meta combinations, repeated keydown, composition, or an already prevented event. Escape from the main terminal prompt moves focus to the Terminal route link without scrolling; H or T can then switch views.

### Post Rows
Flat linked rows with muted date/read-time metadata and Inter titles. Hover fills the row with panel and turns its title purple over 150ms ease-out. Featured rows add a larger title, description, and source-count byline. Home and archive render directly through Astro; they are not React islands.

### Buttons
Subscription uses a green filled control with black mono semibold text and 90% hover opacity. Header Subscribe uses panel fill, a bright border, and accent text/border on hover over 150ms ease-out. Terminal command buttons are transparent, bordered mono controls; hover brightens the rule and turns text accent. All retain visible keyboard focus.

### Inputs / Fields
Email fields use black fill, a bright one-pixel border, the control radius, 8px/12px padding, and mono control text. Focus shifts the border to purple. On publication and popover surfaces, min-width is zero and minimum height is 44px. The terminal email field is transparent and borderless, wraps within its form, and uses a green caret plus the global keyboard outline. Error output is red; confirmation is green.

### Terminal Plate
The interactive terminal is a React island on its own route. It retains red/amber/green chrome dots, CRT treatment, and server-rendered welcome content through its slot. The route sets the surface radius to 6px and adds a soft floating shadow with a restrained purple halo. The transcript has a 420px minimum height and 24px padding, reducing to 340px and 18px on mobile; desktop fine-pointer layouts retain a 34rem maximum height and internal scrolling. At widths up to 760px or with a coarse pointer, the transcript expands without a maximum height, so the page is the only scroll surface. New command output scrolls the prompt into view on the page. Command controls remain 44px tall. Empty Tab and Shift+Tab preserve native focus escape; completion stays available for typed prefixes. Escape also leaves the prompt by focusing the Terminal navigation link. A muted mono hint below the contained plate explains Esc, then H or T; it uses 12px type, 1.7 line-height, and a 16px top margin.

Cursor blink uses 1.1s steps(1); the footer status pulse uses 2.4s ease-out. Reduced motion disables those animations and collapses transition/animation durations globally. Retained rise animation is 550ms with a 14px translation, used on legacy content only.

### Audio Player
The existing article AudioPlayer remains a separate React island. Its compact panel retains the mono controls, green playback action, keyboard-operable scrubber, ten-second skip controls, speed selection, and loading/error states. This redesign preserves the audio source and controls from main.

### Cards / Containers
Older article, travel, and about surfaces retain panel containers, one-pixel borders, plate radius, and 20–28px padding. The DigestCard source remains available with panel at 70%, backdrop blur, colored edge cycling, and 300ms hover/lift/glow, but the current home and archive use PostRow. These components do not justify turning new publication lists into card stacks.

### Chips
Existing article tags are compact bordered chips with 2px/6px padding and the chip radius. Their faint inherited text is recorded as contrast drift rather than a reusable text-color decision.

### Focus Ring
Links and controls use a 2px accent outline with a 2px offset on focus-visible, except inputs with their own explicit border focus treatment.

## Do's and Don'ts

### Do:
- **Do** retain the confirmed black, purple, and green palette across web and newsletter surfaces.
- **Do** pair mono identity and metadata with Inter publication titles and prose.
- **Do** preserve thin rules, responsive reading order, and visible Home / Terminal routes.
- **Do** use muted or brighter text for information and preserve keyboard focus treatment.
- **Do** keep publication content server-rendered and terminal welcome content present before hydration.
- **Do** respect reduced motion and allow form fields and long titles to shrink or wrap.

### Don't:
- **Don't** add the dot grid, card stack, or decorative bloom to the publication index.
- **Don't** extend inherited faint informational text or uppercase tracked eyebrows into new surfaces.
- **Don't** apply CRT scanlines outside terminal surfaces.
- **Don't** remove visible focus feedback or trap native keyboard navigation.
- **Don't** replace textual shell identity with emoji or glyph interface icons.

Not canonized or repaired: inherited faint article/tag/terminal information, uppercase tracked source/subscription eyebrows, and glyph arrow/check/emoji decorations remain in shipped code; this documentation pass records their scope without promoting them into reusable rules or changing UI.
