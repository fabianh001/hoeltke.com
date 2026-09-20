# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are AI practitioners, software engineers, and technical researchers looking for a condensed, high-signal summary of what actually happened in AI over the past week without hype, fluff, or marketing spin. Secondary visitors are developers curious about the autonomous architecture or Fabian Hoeltke's work.

## Product Purpose

Automatically curate, summarize, and ship a weekly AI digest (**AI Weekly**) every Friday at 07:00 UTC across web, email newsletter, RSS, and TTS audio. Success is a reader staying informed on meaningful AI technical progress in under 5 minutes, backed by zero-maintenance autonomous publishing.

## Positioning

A zero-human-in-the-loop autonomous publication built with strict factual grounding: the pipeline refuses to publish any story citing a URL not in its collected source corpus. Unlike manual curated lists or noisy AI summaries, it is 100% transparent, source-validated, and operates completely hands-off.

## Operating Context

- Read weekly on web (desktop & mobile browsers) or delivered directly to inboxes via Resend newsletter broadcasts.
- Listened to via embedded TTS audio players for on-the-go consumption.
- Discovered and navigated on desktop via an interactive retro terminal interface (`help`, `digest`, `about`, `subscribe`).
- Syndicated via RSS reader feeds.

## Capabilities and Constraints

- **Autonomous Pipeline**: Scheduled weekly cron (GitHub Actions) collects feeds, filters/summarizes via LLM structured outputs (OpenRouter / Claude), verifies citations, and commits markdown issues directly.
- **Delivery Channels**: Static Astro web pages, email broadcasts (Resend API), RSS XML feed (`/rss.xml`), and TTS audio generation.
- **Subscription Management**: Zero-dependency Node service with HMAC double opt-in verification running behind a VPS reverse proxy.
- **Performance & Tech Constraints**: Static HTML generation via Astro with minimal client-side React islands (`Terminal`, `AudioPlayer`), styled with Tailwind CSS v4. No heavy client runtimes or intrusive analytics.
- **Styling Paradigm**: Dark-mode, terminal/CRT aesthetic with monospace typography (`JetBrains Mono`, `Inter`), prompt glyphs, and subtle glow accents.

## Brand Commitments

- **Name**: hoeltke.com / AI Weekly.
- **Voice**: Direct, technical, cynical of hype, high-signal, transparent.
- **Authorship**: Publication-first. AI Weekly is the headline product; Fabian Hoeltke's personal branding remains understated, quiet, and secondary.
- **Identity**: Terminal/hacker aesthetic with green/amber accents, scanlines, and CLI affordances, balanced with clean typographic hierarchy for long-form reading.

## Evidence on Hand

- Published weekly issues in `src/content/digest/` (e.g., `2026-34.md` and archive).
- Active source curation list in `scripts/sources.json`.
- Production deployment at [hoeltke.com](https://hoeltke.com).
- Automated CI workflows in `.github/workflows/`.

## Product Principles

1. **Publication-First, Quiet Author**: The value is the digest and the pipeline's output; personal branding provides credibility and context without overshadowing the publication.
2. **Strict Pipeline Honesty**: Every issue is explicitly labeled as auto-curated and AI-summarized. Citations are strictly validated against input feeds; hallucinations or uncited claims halt publishing.
3. **High Signal, Zero Noise**: Ruthlessly filter out marketing fluff, buzzword PR, and repetitive news in favor of foundational research, tooling, and genuine technical shifts.
4. **Keyboard & Terminal Ethos**: Interactive surfaces honor terminal paradigms (scanlines, prompt commands, monospaced clarity) while preserving effortless legibility for standard web reading.
5. **Lightweight & Blazing Fast**: Fast static delivery, minimal JavaScript overhead, and immediate content availability across all platforms.

## Accessibility & Inclusion

- Semantic HTML structure with single `h1` per page and valid landmark roles.
- High-contrast text against dark backgrounds adhering to WCAG AA/AAA.
- Full keyboard operability for interactive components (terminal navigation, audio player controls, subscription forms).
- Screen-reader friendly alternatives to ASCII / terminal decorative art and clear audio player ARIA states.
