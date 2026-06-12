# hoeltke.com

A personal site that writes its own blog.

<img width="1001" height="776" alt="image" src="https://github.com/user-attachments/assets/4a7da535-3f95-4906-8b7d-92a04a36ed90" />



Every Friday at 07:00 UTC, a pipeline reads the week's AI news — research blogs,
Hacker News, the usual suspects — hands everything to Claude, and publishes
**AI Weekly**: one digest of the stories that actually matter, with sources.
No humans in the loop. The homepage is a terminal. Type `help`.

**Live at [hoeltke.com](https://hoeltke.com)** · [RSS](https://hoeltke.com/rss.xml)

## How it works

```
                  ┌────────────────────────────────────────────┐
  RSS feeds ──────▶                                            │
  Hacker News ────▶  scripts/generate-digest.ts                │
                  │  · collect last 7 days                     │
                  │  · Claude picks + summarizes top stories   │
                  │  · validates every cited URL               │
                  └──────────────┬─────────────────────────────┘
                                 │ commits src/content/digest/YYYY-WW.md
                                 ▼
                  ┌────────────────────────────────────────────┐
                  │  Astro build → rsync → Caddy on a VPS      │
                  └────────────────────────────────────────────┘
```

- **Site**: [Astro](https://astro.build) + React islands + Tailwind CSS v4 — static HTML, one island (the terminal)
- **Digest**: [Claude](https://claude.com) (`claude-sonnet-4-6`) with structured outputs; the pipeline refuses to publish if a story cites a URL it wasn't given
- **CI**: GitHub Actions — `weekly-digest.yml` (cron) and `deploy.yml` (rsync over SSH)
- **Honesty**: every issue is labeled as auto-curated & AI-summarized, sources linked

## Local development

```sh
npm install
npm run dev               # dev server
npm run build             # static build to dist/
npm run digest -- --dry-run   # test feed collection without an API key
ANTHROPIC_API_KEY=... npm run digest  # generate this week's issue
```

Sources live in [`scripts/sources.json`](scripts/sources.json) — PRs with good feeds welcome.

Server + DNS setup: [`docs/server-setup.md`](docs/server-setup.md).
