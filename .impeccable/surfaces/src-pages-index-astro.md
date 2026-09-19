---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/components/Terminal.tsx"]
---

# Surface brief — `/` (landing page)

Scope: `src/pages/index.astro`, the terminal island's initial state, and the homepage `<title>`.
Visitor mode: **Persuade**.

Audience: first-time visitors, digest-first — AI practitioners deciding in seconds whether this is worth reading, and evaluators reading the artifact itself. Job: understand what this publication is, read this week's issue, subscribe.
Action: read the latest issue; subscribe.
Proof: 15 real published issues, every story source-linked, the pipeline itself.
Constraint: content is machine-generated and varies in length; the same tokens feed the newsletter email.

Trigger: a real visitor reported not understanding what the site is.

## Direction contract

THESIS: The terminal arrives having already run the command. This surface refuses the category default of a marketing hero stacked above a demo — the demo *is* the masthead, and its output is this week's actual journalism, present in the HTML before a single frame of animation. It equally refuses the incumbent arrangement, where the page's meaning was client-side state gated behind 1400ms of boot theater.

OWN-WORLD: The committed incumbent world, unchanged: pure black ground (`--bg` #000), terminal plate at `--term-bg` #050507, hairline `--line` borders, JetBrains Mono throughout, neon green `--prompt` #3ef78f for executed commands and purple `--accent` #9050ff for links and focus. Component language is the terminal plate: a chrome strip, a prompt line, and typed output. No cards, no gradients, no glass. The CRT glow (`--glow`) stays as the plate's only depth.

STORY: The visitor reads one sentence that names the publication, its cadence, and who writes it. Immediately beneath, inside the terminal, they see `$ cat digest/latest` already executed and this week's real headline at display weight with its summary at reading weight. They understand it is a weekly AI newsletter before deciding anything. They either open the issue or subscribe in-frame; the terminal remains fully interactive for the visitor who wants to poke it.

FIRST VIEWPORT: A masthead line at the top in plain sentence case, stating what this is — not an eyebrow, a sentence. Below it the terminal plate fills the fold: chrome strip with the three-dot affordance and `hoeltke.com — digest`, then the executed `$ cat digest/latest` in prompt green, then issue number and date in faint mono, the headline at ~1.75rem display weight in ink, the description at reading weight in muted, and a source count. A visible `$ subscribe` line with a live inline field sits inside the frame as the last output row. Primary action is the headline link; subscribe is the second, equally reachable. The cursor blinks after the subscribe row, so the frame reads as live rather than finished.

FORM: "Already Run" — candidate 5 of 7 on my resonance-ordered list, dealt by the roll (indices 7, 5, 3; index 7 led and the user locked 5). Seed key `f6e154f1`, scope surface, mode persuade. Code-led: no image generation in this harness.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved

- Analytics deliberately cut (`dec-1a98e3e1`); no post-ship signal on subscribe conversion.
