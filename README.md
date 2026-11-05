# hoeltke.com

My personal site and home to **AI Weekly**, an automated AI news digest published
every Friday. Read it on the web, subscribe by email or RSS, or listen to the
audio edition.

<img width="1624" height="1061" alt="image" src="https://github.com/user-attachments/assets/29d7ad82-ee0e-4d9f-9881-dbd47918479a" />

The homepage lists recent issues. There's also an interactive
[terminal](https://hoeltke.com/terminal/) for exploring my work and the site.
Type `help` to see the commands.

**Live at [hoeltke.com](https://hoeltke.com)** · [RSS](https://hoeltke.com/rss.xml)

## How it works

GitHub Actions starts the weekly run on Fridays at 07:00 UTC.

1. `scripts/generate-digest.ts` collects the last seven days of articles from RSS
   feeds and Hacker News. An LLM selects and summarizes the stories; the script
   checks that every cited URL came from the collected articles.
2. The issue is saved as Markdown in `src/content/digest/`. It either goes straight
   to `main` or opens a PR for review, depending on `NEWSLETTER_REQUIRE_APPROVAL`.
3. The Newsletter workflow generates audio from the final text, commits the audio,
   and deploys the site. It checks the published audio before sending the email
   through Resend. A failure in these steps holds the sendout.

Readers subscribe on the site. A Node service with no external dependencies
(`server/subscribe.mjs`, behind Caddy) handles HMAC double opt-in and adds
confirmed contacts to Resend.

- **Site:** [Astro](https://astro.build), Tailwind CSS v4, and React islands for the
  terminal and audio player. The rest is static HTML.
- **Digest:** structured model output via [OpenRouter](https://openrouter.ai).
  The default is `deepseek/deepseek-v4.1-flash-1017`; set `DIGEST_MODEL` to override it.
- **Email:** [Resend](https://resend.com) broadcasts, with HTML built from the site's
  design tokens. Subscriptions use HMAC double opt-in.
- **RSS and audio:** full issue text and podcast audio enclosures in the RSS feed,
  plus an audio player on each issue page when audio is available.
- **Deployment:** GitHub Actions builds the Astro site and syncs it and the
  subscribe service to a VPS over SSH. Caddy serves the site.

The digest is labeled as auto-curated and AI-summarized, with links to its sources.
Set the repository variable `NEWSLETTER_REQUIRE_APPROVAL=true` to review each
draft in a PR before publishing. Leave it unset to publish and send automatically.

[Development and publishing docs](docs/development.md) — local setup, digest
generation, newsletter approval, and audio.
