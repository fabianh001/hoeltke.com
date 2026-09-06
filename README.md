# hoeltke.com

A personal site that writes its own blog.

<img width="1001" height="776" alt="image" src="https://github.com/user-attachments/assets/4a7da535-3f95-4906-8b7d-92a04a36ed90" />



Every Friday at 07:00 UTC, a pipeline reads the week's AI news — research blogs,
Hacker News, the usual suspects — hands everything to an LLM, and publishes
**AI Weekly**: one digest of the stories that actually matter, with sources.
No humans in the loop. Read it on the web, subscribe by email, or grab the RSS
feed. The homepage is a terminal. Type `help`.

**Live at [hoeltke.com](https://hoeltke.com)** · [RSS](https://hoeltke.com/rss.xml)

## How it works

```
                  ┌────────────────────────────────────────────┐
  RSS feeds ──────▶                                            │
  Hacker News ────▶  scripts/generate-digest.ts                │
                  │  · collect last 7 days                     │
                  │  · an LLM picks + summarizes top stories   │
                  │  · validates every cited URL               │
                  └──────────────┬─────────────────────────────┘
                                 │ commits src/content/digest/YYYY-WW.md
                                 ▼
                  ┌────────────────────────────────────────────┐
                  │  Astro build → rsync → Caddy on a VPS      │
                  └──────────────┬─────────────────────────────┘
                                 │ same run emails the new issue
                                 ▼
                  ┌────────────────────────────────────────────┐
                  │  send-newsletter → Resend broadcast        │
                  │  → subscribers (dark, on-brand email)      │
                  └────────────────────────────────────────────┘
```

Readers subscribe on the site; a zero-dependency Node service on the VPS
(`server/subscribe.mjs`, behind Caddy) handles HMAC double opt-in and adds
confirmed contacts to Resend.

- **Site**: [Astro](https://astro.build) + React islands + Tailwind CSS v4 — static HTML, one island (the terminal)
- **Digest**: any model via [OpenRouter](https://openrouter.ai) (default `anthropic/claude-sonnet-4-6`, override with `DIGEST_MODEL`) using structured outputs; the pipeline refuses to publish if a story cites a URL it wasn't given
- **Newsletter**: each issue also goes out by email via [Resend](https://resend.com) as a dark, on-brand broadcast built from the site's own design tokens; $0 on the free tier at this scale
- **CI**: GitHub Actions — `weekly-digest.yml` (cron: generate + email) and `deploy.yml` (rsync the site + subscribe service over SSH)
- **Honesty**: every issue is labeled as auto-curated & AI-summarized, sources linked

## Local development

```sh
npm install
npm run dev               # dev server
npm run build             # static build to dist/
npm test                  # unit + component tests
npm run digest -- --dry-run   # test feed collection without an API key
OPENROUTER_API_KEY=... npm run digest -- --preview  # generate + print + write a gitignored preview (npm run dev → /digest/preview)
OPENROUTER_API_KEY=... npm run digest  # generate this week's issue (writes the file)
OPENROUTER_API_KEY=... npm run digest -- --slug 2026-24-extra  # extra issue under a custom slug
DIGEST_MODEL=openai/gpt-5.1 OPENROUTER_API_KEY=... npm run digest -- --preview  # try another model
npm run send-newsletter -- --dry-run  # build the most recently generated issue's email and print, no send (no key needed)
```

Sources live in [`scripts/sources.json`](scripts/sources.json) — PRs with good feeds welcome.

Repetition guard: the generator reads the last 4 issues, drops any collected item whose URL was already cited, and hands the model the past headlines with an instruction to skip already-covered stories unless there is a genuinely new development (`LOOKBACK_ISSUES` in `scripts/generate-digest.ts`).

Server + DNS setup: [`docs/server-setup.md`](docs/server-setup.md).
