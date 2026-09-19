# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, served in this order:

1. **AI practitioners skimming the week** — engineers, researchers, and people who
   work adjacent to AI, landing with a few minutes and a question: *did anything
   actually happen this week?* They read one issue, and the good outcome is they
   subscribe so Friday comes to them instead.
2. **Hiring managers, recruiters, and peers evaluating Fabian** — they arrive from a
   profile link or a shared issue. They are not here to read the news; they are
   reading the artifact. The working pipeline is the portfolio piece.

The site is **digest-first**: the reader's experience is designed for audience 1, and
audience 2 is served as a consequence of that work being visibly well made. When the
two conflict, the reader wins.

## Product Purpose

hoeltke.com is a personal site that publishes **AI Weekly**: a digest of the week's AI
news, selected and summarized without a human in the loop, and distributed on the web,
by email, and over RSS.

Success over the next 12 months is **subscriber growth**. The email list is the
scoreboard. Design work is measured against two questions: does a first-time reader
finish an issue, and do they subscribe.

## Positioning

The mechanism is the position: the digest is written by a pipeline, on a schedule,
with no editorial pass. A neighboring newsletter cannot truthfully say the same. Two
consequences are load-bearing and must survive any redesign:

- **It is labeled.** Every issue says it is auto-curated and AI-summarized. The
  automation is disclosed, never laundered as human editorial judgment.
- **It is checkable.** Every story links its sources, and the generator refuses to
  publish a story that cites a URL it was not given.

The site is also its own proof: it is built by the person it is about, and it runs
itself. That claim is only worth making while it is true.

## Operating Context

- **Publishing cadence:** every Friday, 07:00 UTC, via GitHub Actions cron
  (`weekly-digest.yml`). The run generates the issue, commits it, deploys the site,
  and emails subscribers in the same pass.
- **Review gate:** repo variable `NEWSLETTER_REQUIRE_APPROVAL=true` routes the weekly
  issue into a PR for a copy edit before merge; unset, it publishes and sends
  unattended. Both modes are supported states, not a transition.
- **Reading surfaces:** the issue is read on the web (`/digest/<slug>/`), in an HTML
  email built from the site's own tokens, and in an RSS reader. The same issue must
  hold up in all three.
- **Entry points:** direct visit, a shared issue link, RSS, the email itself, and
  profile links from GitHub and LinkedIn.
- **Deployment:** Astro static build → rsync → Caddy on a VPS. A zero-dependency Node
  service (`server/subscribe.mjs`) behind Caddy handles HMAC double opt-in and adds
  confirmed contacts to Resend.

## Capabilities and Constraints

**Ships today**

- Interactive terminal homepage (the one React island) with a command set, tab
  completion, and the latest issues addressable from it.
- Digest index and issue pages generated from the `digest` content collection
  (`title`, `description`, `date`, `issue`, `tags`, `sources`).
- Email subscribe with HMAC double opt-in, a confirmation email, and a
  `/subscribed` landing page.
- RSS feed, sitemap, `llms.txt`, and generated OG images (`astro-og-canvas`).
- `/travel` — a noindex easter egg recovered from the 2019 version of the site,
  reachable from the terminal rather than the nav.
- Repetition guard: the generator reads the last 4 issues and drops items whose URLs
  were already cited (`LOOKBACK_ISSUES`).

**Constraints**

- Astro static output with React islands; the terminal is the only island today.
  Keeping client JS proportionate is a standing preference, not yet a hard budget.
- No CMS and no database. Issues are markdown files in the repo; subscribers live in
  Resend.
- Content is machine-generated. Design cannot assume an editor will fix awkward
  copy, tune a headline, or supply an image per story.
- Issue length, tag count, and source count vary run to run. Every layout must
  survive a thin issue and a fat one.
- Email rendering is a real target: the newsletter is built from the site's tokens
  and inlined with `juice`, so token changes propagate into an environment with far
  less CSS support than the browser.

**Explicitly undecided**

- No accessibility standard has been committed to (see below).
- No analytics or measurement of the subscribe funnel has been established, despite
  subscriber growth being the stated goal.

## Brand Commitments

- **Name and voice:** "hoeltke.com" and "AI Weekly". The voice is lowercase,
  terse, technical, and dry — shell-flavored without being a costume. Present in
  shipped copy (`# whoami`, `psst — the terminal knows more than this page does`).
- **Honesty about automation:** the auto-curated / AI-summarized label and linked
  sources are product commitments, not styling. They survive any redesign.
- **The identity is Fabian's own.** Name, GitHub and LinkedIn links, the Datadog
  affiliation, and the `Person` schema are factual and must stay accurate.

**Nothing visual is locked.** Fabian confirmed that the terminal homepage, the
black/neon-purple/green palette, JetBrains Mono, and the CRT glow are all fair game
for a later redesign. They are the incumbent system and current design authority —
not a constraint on what the site could become.

## Evidence on Hand

- 15 published issues in `src/content/digest/` (2026-24 through 2026-37), plus a
  gitignored preview slot — real content to design against, including the thin and
  awkward ones.
- Real photography in `src/assets/travel/` (7 images, Australia 2019).
- Generated OG images via `astro-og-canvas` (`src/pages/og/`).
- A working, documented pipeline: `scripts/generate-digest.ts`,
  `scripts/sources.json`, `server/subscribe.mjs`, `docs/server-setup.md`, and the
  three GitHub Actions workflows.
- Test coverage for the subscribe form, terminal subscribe, and email shell.

**Absences future work must not fabricate:** there are no subscriber counts, open
rates, testimonials, press mentions, customers, or endorsements. There is no
pricing — everything is free. Do not invent social proof, and do not state a list
size until Fabian supplies a real number.

## Product Principles

1. **The reader is the customer; the résumé is the receipt.** Every design decision
   is argued from "does this help someone finish the issue and subscribe," never
   from "does this look impressive to a hiring manager."
2. **Disclose the machine, then earn trust anyway.** The automation is stated plainly
   and the sources are one click away. Credibility comes from checkability, not from
   sounding human.
3. **Design for content nobody edited.** Layouts, hierarchy, and components must hold
   up against whatever the model produced this week — short, long, lopsided, or off.
4. **One issue, three surfaces.** Web, email, and RSS are not tiers. A change that
   improves the page and breaks the email is not finished.
5. **It has to keep running.** Anything that requires weekly human attention to stay
   good is the wrong answer for this product.

## Accessibility & Inclusion

No standard has been committed to and no specific user need has been established.
Recorded as open: given that the incumbent world is pure black with neon accents and
a mono-first type stack, contrast, focus visibility, and reduced-motion handling are
the likely first questions whenever the visual system is next touched — but nothing
here is a confirmed requirement yet.
