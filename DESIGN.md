---
name: hoeltke.com
description: The Phosphor Archive — a high-contrast dark CRT terminal design system for autonomous AI digests and tactical technical reading.
colors:
  primary: "#9050ff"
  primary-vivid: "#7700ff"
  prompt: "#3ef78f"
  signal-green: "#3ef78f"
  signal-amber: "#d9a43b"
  signal-red: "#d33043"
  signal-blue: "#0164ff"
  bg: "#000000"
  bg-raised: "#0a0a0d"
  panel: "#0a0a0d"
  term-bg: "#050507"
  line: "#222228"
  line-bright: "#3a3a42"
  text: "#ffffff"
  muted: "#9a9aa2"
  faint: "#5f5f67"
typography:
  display:
    fontFamily: "Inter Variable, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter Variable, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "JetBrains Mono Variable, ui-monospace, 'SF Mono', monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
  body:
    fontFamily: "Inter Variable, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, 'SF Mono', monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-vivid}"
  terminal-panel:
    backgroundColor: "{colors.term-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: hoeltke.com

## Overview

**Creative North Star: "The Phosphor Archive"**

The visual language of `hoeltke.com` is anchored in the austere, deliberate craft of a high-contrast CRT command station. It strips away modern commercial SaaS gloss, corporate whitespace indulgence, and hollow decorative noise in favor of sheer informational density, tactical keyboard affordances, and razor-sharp typographic discipline.

The foundation is deep pitch black (`#000000`) layered with ultra-dark charcoal panels (`#0a0a0d`) and hairline borders (`#222228`). Content radiates through targeted phosphor glows: glowing electric violet accents (`#9050ff`), tactical command prompt green (`#3ef78f`), and amber operational indicators (`#d9a43b`). An interactive cursor spotlight reveals a subtle radial dot matrix, evoking physical cathode-ray screen hardware without impeding long-form reading.

**Key Characteristics:**
- Tactical pitch-black and deep carbon canvases with hairline demarcation.
- Dual typographic pairing: crisp `JetBrains Mono` for command navigation and metadata, paired with clean `Inter` for uninterrupted editorial reading.
- Atmospheric phosphor glow (`rgba(119, 0, 255, 0.35)`) and scanline vignette (`.crt`) wrapping terminal surfaces.
- High signal-to-noise ratio: color conveys active state, pipeline provenance, or verified links, never mere decoration.

## Colors

The palette pairs an uncompromising dark foundation with electric phosphor highlights.

### Primary
- **Electric Violet** (`#9050ff` / vivid `#7700ff`): The core action and brand accent. Used for interactive highlights, active audio scrubber tracks, focused borders, link hover states, and atmospheric glow overlays.

### Secondary
- **Phosphor Emerald** (`#3ef78f`): The prompt and pipeline execution color. Used for CLI prompts (`$`, `→`), inline code snippets, active status indicators, and terminal success messages.
- **Amber Warning** (`#d9a43b`): Pipeline status alerts, audio playback speed badges, and caution notices.

### Tertiary
- **Signal Red** (`#d33043`): Terminal errors and alert states.
- **Signal Blue** (`#0164ff`): Alternate system status metadata.

### Neutral
- **Deep Void** (`#000000`): The primary document canvas and background.
- **Carbon Panel** (`#0a0a0d` / `#050507`): Raised card surfaces, terminal backgrounds, and elevated dialogs.
- **Hairline Border** (`#222228`): Structural dividers, card borders, and grid lines.
- **Hairline Bright** (`#3a3a42`): Active element borders, input focus strokes, and hover outlines.
- **Bright White** (`#ffffff`): Primary reading text and high-emphasis headlines.
- **Muted Steel** (`#9a9aa2`): Secondary text, timestamps, and prose blockquotes.
- **Faint Graphite** (`#5f5f67`): Terminal comments, prompt helper text, and subtle metadata.

### Named Rules
**The Rarity of Glow Rule.** Phosphor glows and neon accents are strictly reserved for active states, terminal focus, or confirmed links. At rest, the interface remains calm, dark, and monochromatic.

## Typography

**Display Font:** Inter Variable (fallback: system-ui, -apple-system, sans-serif)
**Body Font:** Inter Variable (fallback: system-ui, -apple-system, sans-serif)
**Label/Mono Font:** JetBrains Mono Variable (fallback: ui-monospace, 'SF Mono', monospace)

**Character:** Technical precision meets editorial clarity. Headers and articles employ `Inter` with tight letter-spacing for effortless scanning, while metadata, status badges, CLI prompts, and dates rely on `JetBrains Mono`.

### Hierarchy
- **Display** (Bold 700, `clamp(1.75rem, 4vw, 2.5rem)`, line-height 1.15): Article hero titles and major section anchors.
- **Headline** (SemiBold 600, `1.25rem` / `20px`, line-height 1.3): Issue section headers and card titles.
- **Title** (Mono SemiBold 600, `0.875rem` / `14px`, line-height 1.4, tracking uppercase): Section dividers and CLI command banners (`$ ls digest/ --latest`).
- **Body** (Regular 400, `0.9375rem` / `15px`, line-height 1.65, max-width `68ch`): Long-form digest issue reading and technical explanations.
- **Label** (Mono Medium 500, `0.75rem` / `12px`, line-height 1.2, tracking `0.08em`): Metadata chips, timestamps, issue numbers, and keyboard shortcuts.

### Named Rules
**The Terminal Prompt Rule.** Any section header functioning as a navigational anchor or directory listing must be preceded by a mono prompt symbol (`$` or `→`) in `Phosphor Emerald`.

## Layout

The spatial model centers content within a disciplined single-column grid (`max-w-2xl` / `672px` up to `max-w-3xl` / `768px`) with generous vertical rhythm (`mt-14` / `56px` section gaps). 
- **Dot Spotlight Grid**: Fixed background grid (`radial-gradient` 28px × 28px) subtly revealed around the mouse cursor via a soft radial mask (`var(--dot)`), creating subtle tactile depth without interfering with reading.
- **Reading Cleanliness**: Long-form reading pages disable the dot grid entirely (`body.no-grid`) to eliminate visual vibration.

## Elevation & Depth

Surfaces rely on **tonal layering and localized phosphor glow** rather than realistic drop shadows.
- **Ground Floor**: `#000000` (pure black body).
- **First Floor (Panels & Cards)**: `#0a0a0d` surrounded by 1px `#222228` hairline borders.
- **Terminal Elevated**: `#050507` with `shadow-[0_0_40px_var(--glow)]` emitting an ethereal violet aura (`rgba(119, 0, 255, 0.35)`).

### Named Rules
**The Flat-at-Rest Rule.** Containers have no drop shadows at rest. Shadow is strictly light emission (glow) representing machine power or active hover/focus state.

## Shapes

- **Corners**: Rounded geometry is restrained (`rounded-xl` / 12px on large panels, `rounded-lg` / 8px on cards and interactive bars, `rounded-md` / 6px on small buttons, `rounded-full` exclusively for status dots and pills).
- **Borders**: Crisp, uniform 1px solid hairlines (`#222228` resting, `#3a3a42` active).
- **CRT Treatment**: Terminal surfaces feature a continuous overlay vignette and repeating 1px scanlines (`.crt`).

## Components

### Terminal Chrome (`<Terminal />`)
- **Container**: Dark carbon background (`#050507`), 12px rounded corners, 1px `#222228` border, CRT scanlines, and 40px diffuse violet glow.
- **Prompt**: Green chevron (`>`), monospaced input, blinking solid phosphor block cursor (`.cursor-block`).
- **Commands**: Keyboard-driven command loop (`help`, `digest`, `about`, `subscribe`, `clear`).

### Audio Player (`<AudioPlayer />`)
- **Bar**: Compact floating or embedded pill with dark translucent backdrop (`bg-panel/90` with blur), 1px `#line` border.
- **Controls**: Monospaced play/pause toggle with playback speed selector (`1x`, `1.25x`, `1.5x`), scrubber track in `#line` filled with `#accent`, and timestamp readout.

### Digest Card (`<DigestCard />`)
- **Surface**: Background `#0a0a0d`, 1px border `#222228`, 12px radius.
- **Hover**: Border transition to `#3a3a42`, title highlight in `#accent`.
- **Metadata**: Issue badge in `JetBrains Mono` (`#5f5f67`), publication date, and condensed summary.

### Status Indicator (`<StatusDot />`)
- **Visual**: 6px pulsing emerald dot (`#3ef78f`) surrounded by an expanding harmonic ring (`pulse-dot` animation), accompanied by monospaced pipeline status text.

### Inputs & Newsletter (`<SubscribeForm />`)
- **Input**: Dark panel fill, monospaced placeholder, 1px `#line` border shifting to `#accent` with subtle glow on focus.
- **Submit Button**: High-contrast, tactile pill/rectangle with instant feedback.

## Do's and Don'ts

### Do:
- **Do** maintain the dark phosphor terminal aesthetic across all interactive controls.
- **Do** preserve the dual-font rule: `JetBrains Mono` for command chrome, status, and code; `Inter` for prose and long-form reading.
- **Do** strictly use 1px hairline borders (`#222228` / `#3a3a42`) for structural demarcation.
- **Do** respect `prefers-reduced-motion` by disabling cursor blink, dot pulses, and entry animations.

### Don't:
- **Don't** introduce warm pastel tones, colorful drop shadows, or generic multi-color gradients.
- **Don't** use light-mode palettes; the interface is strictly dark-mode first.
- **Don't** clutter long-form reading pages with interactive dot grids or excessive neon distraction.
- **Don't** make non-interactive text monospaced if it exceeds two lines; reserve `Mono` for code, headers, and metadata.
