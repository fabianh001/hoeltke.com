# hoeltke.com

A personal site that writes its own blog.

<img width="1624" height="1061" alt="image" src="https://github.com/user-attachments/assets/9429be5f-0bc4-4bdf-887b-c31080248cc8" />



Every Friday at 07:00 UTC, a pipeline reads the week's AI news — research blogs,
Hacker News, the usual suspects — hands everything to an LLM, and publishes
**AI Weekly**: one digest of the stories that actually matter.

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
- **Digest**: any model via [OpenRouter](https://openrouter.ai) (default `deepseek/deepseek-v4.1-flash-1017`, override with `DIGEST_MODEL`) using structured outputs; the pipeline refuses to publish if a story cites a URL it wasn't given
- **Newsletter**: each issue also goes out by email via [Resend](https://resend.com) as a dark, on-brand broadcast built from the site's own design tokens; $0 on the free tier at this scale
- **CI**: GitHub Actions — `weekly-digest.yml` (cron: generate), `newsletter.yml` (email an issue), `deploy.yml` (rsync the site + subscribe service over SSH)
- **Review gate**: with repo variable `NEWSLETTER_REQUIRE_APPROVAL=true` the weekly issue lands in a PR instead of on `main` — edit the copy, then merge to deploy the site and email subscribers; unset it and the issue publishes and sends automatically
- **Honesty**: every issue is labeled as auto-curated & AI-summarized, sources linked

[Development and publishing docs](docs/development.md) — local setup, digest
generation, newsletter approval, and audio.
