/**
 * AI Weekly digest generator.
 *
 * Collects the last 7 days from curated sources (sources.json + Hacker News),
 * asks the model to pick and summarize the top stories, and writes a new issue to
 * src/content/digest/. Fails loudly on any problem — a broken issue must never
 * be committed.
 *
 * Usage: ANTHROPIC_API_KEY=... npm run digest
 */
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import Parser from 'rss-parser';
import { z } from 'zod';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIGEST_DIR = join(ROOT, 'src/content/digest');
// Local-only preview file (gitignored). --preview overwrites it so `npm run dev`
// renders the generated issue at /digest/preview without publishing anything.
const PREVIEW_PATH = join(DIGEST_DIR, 'preview.md');
const WINDOW_DAYS = 7;
const MAX_ITEMS_PER_SOURCE = 12;
const MAX_SNIPPET_CHARS = 700;
const MAX_OUTPUT_TOKENS = 8000;
// How many past issues the curator sees so it doesn't re-run a story. Stories
// resurface under new URLs (follow-ups, post-mortems, third-party write-ups),
// so a URL blocklist alone isn't enough — the model needs the headlines too.
const LOOKBACK_ISSUES = 4;
// Any OpenRouter model slug. Override per-run with DIGEST_MODEL=… to A/B providers.
const DIGEST_MODEL = process.env.DIGEST_MODEL || 'anthropic/claude-sonnet-4-6';

interface RawItem {
  source: string;
  title: string;
  url: string;
  date: string;
  snippet: string;
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function collectFeeds(): Promise<RawItem[]> {
  const config = JSON.parse(readFileSync(join(ROOT, 'scripts/sources.json'), 'utf8'));
  const cutoff = Date.now() - WINDOW_DAYS * 24 * 3600 * 1000;
  const parser = new Parser({ timeout: 20_000 });
  const items: RawItem[] = [];

  for (const feed of config.feeds) {
    try {
      const result = await parser.parseURL(feed.url);
      const fresh = (result.items ?? [])
        .filter((i) => i.isoDate && new Date(i.isoDate).getTime() > cutoff)
        .slice(0, MAX_ITEMS_PER_SOURCE);
      for (const i of fresh) {
        items.push({
          source: feed.name,
          title: i.title ?? 'untitled',
          url: i.link ?? feed.url,
          date: i.isoDate!.slice(0, 10),
          snippet: stripHtml(i.contentSnippet ?? i.content ?? '').slice(0, MAX_SNIPPET_CHARS),
        });
      }
      console.log(`✓ ${feed.name}: ${fresh.length} items`);
    } catch (err) {
      console.warn(`⚠ ${feed.name} failed: ${(err as Error).message}`);
    }
  }

  // Hacker News via Algolia: the week's top stories by points. No keyword filter —
  // major launches ("Claude Fable 5", model/company names) rarely contain the word
  // "AI", so a query=AI prefilter silently drops the biggest stories. Instead we
  // hand the curator the top-voted stories and let it pick the AI-relevant ones.
  try {
    const since = Math.floor(cutoff / 1000);
    const hn = config.hackerNews;
    const url = `https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points>${hn.minPoints},created_at_i>${since}&hitsPerPage=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { hits: any[] };
    const top = data.hits
      .filter((h) => h.title)
      .sort((a, b) => b.points - a.points)
      .slice(0, hn.maxItems ?? 30);
    for (const hit of top) {
      items.push({
        source: `Hacker News (${hit.points} points)`,
        title: hit.title,
        url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
        date: hit.created_at.slice(0, 10),
        snippet: '',
      });
    }
    console.log(`✓ Hacker News: ${top.length} items`);
  } catch (err) {
    console.warn(`⚠ Hacker News failed: ${(err as Error).message}`);
  }

  return items;
}

interface PastIssue {
  issue: number;
  date: string;
  headlines: string[];
  urls: string[];
}

/** The most recent published issues (newest first), for repetition checks. */
function loadPastIssues(limit = LOOKBACK_ISSUES): PastIssue[] {
  if (!existsSync(DIGEST_DIR)) return [];
  return readdirSync(DIGEST_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'preview.md')
    .map((f) => {
      const text = readFileSync(join(DIGEST_DIR, f), 'utf8');
      return {
        issue: Number(text.match(/^issue:\s*(\d+)/m)?.[1] ?? 0),
        date: text.match(/^date:\s*(\S+)/m)?.[1] ?? '',
        headlines: [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim()),
        urls: [...text.matchAll(/^\s+url:\s*'(.+)'\s*$/gm)].map((m) => m[1].replace(/''/g, "'")),
      };
    })
    .sort((a, b) => b.issue - a.issue)
    .slice(0, limit);
}

const StorySchema = z.object({
  headline: z.string(),
  summary: z.string(),
  whyItMatters: z.string(),
  sourceTitle: z.string(),
  sourceUrl: z.string(),
  tag: z.string(),
});

const DigestSchema = z.object({
  hook: z.string(),
  description: z.string(),
  intro: z.string(),
  stories: z.array(StorySchema),
});

/**
 * Ask the model for the digest as JSON. Prefers strict json_schema (best
 * adherence on capable models — Claude, GPT, Gemini); falls back to the
 * widely-supported json_object mode when a model rejects json_schema (400).
 * Returns the raw JSON string; the caller validates it against DigestSchema.
 */
async function complete(
  client: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<string> {
  const base = { model: DIGEST_MODEL, max_tokens: MAX_OUTPUT_TOKENS, messages };

  try {
    const res = await client.chat.completions.create({
      ...base,
      response_format: zodResponseFormat(DigestSchema, 'digest'),
    });
    const content = res.choices[0]?.message?.content;
    if (content) return content;
    throw new Error('json_schema response had empty content');
  } catch (err) {
    // Only fall back when the model rejects the schema param itself (400).
    // Auth / rate-limit / network errors should surface, not double-fire.
    if ((err as OpenAI.APIError)?.status !== 400) throw err;
    console.warn(`⚠ ${DIGEST_MODEL} rejected strict json_schema; retrying with json_object`);
  }

  const res = await client.chat.completions.create({
    ...base,
    response_format: { type: 'json_object' },
  });
  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error('model returned empty content');
  return content;
}

async function summarize(items: RawItem[], issueNumber: number, past: PastIssue[]) {
  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    // Optional OpenRouter attribution (shows on their model-usage leaderboards).
    defaultHeaders: { 'HTTP-Referer': 'https://hoeltke.com', 'X-Title': 'AI Weekly' },
  });
  const itemList = items
    .map((i) => `- [${i.source}] ${i.title} (${i.date})\n  ${i.url}\n  ${i.snippet}`)
    .join('\n');
  const coveredList = past
    .map((p) => `Issue #${p.issue} (${p.date}):\n${p.headlines.map((h) => `  - ${h}`).join('\n')}`)
    .join('\n');
  const coveredBlock = past.length
    ? `\n\nStories already covered in recent issues — do NOT run these again, even from a different source or angle. The only exception is a genuinely new development (a new release, a reversal, a major finding); in that case say what is new and reference the earlier coverage in one clause.\n\n${coveredList}`
    : '';

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You write "AI Weekly", a sharply curated weekly digest of AI news for software engineers. Voice: direct, technically literate, a little dry-witted, zero hype. You pick only stories that will still matter in a month: model releases, meaningful research, tooling worth adopting, consequential industry/policy moves. Skip funding-round noise, product marketing, and duplicate coverage (merge duplicates into one story, citing the best source). Never repeat a story a previous issue already covered — readers get this every week.`,
    },
    {
      role: 'user',
      content: `Here is everything published in the last ${WINDOW_DAYS} days by my sources:\n\n${itemList}\n\nProduce issue #${issueNumber} of AI Weekly as a single JSON object with these fields:
- "hook": a short, punchy issue subtitle (max 8 words, lowercase, no period) capturing the week's theme
- "description": one sentence (max 160 chars) summarizing the issue, for meta tags and the feed
- "intro": 2-3 sentences opening the issue with the week's big picture
- "stories": the top 4-6 stories. For each: "headline" (your own words), "summary" (2-3 sentences, factual, no hype), "whyItMatters" (1-2 sentences for working engineers), "sourceTitle" + "sourceUrl" (must be copied exactly from the list above), "tag" (one lowercase word, e.g. models, research, tooling, policy, infra)

Only reference stories from the list. Never invent facts or URLs.${coveredBlock}`,
    },
  ];

  const raw = await complete(client, messages);
  const parsed = DigestSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(`model output did not match the digest schema: ${parsed.error.message}`);
  }
  return parsed.data;
}

function nextIssueNumber(): number {
  if (!existsSync(DIGEST_DIR)) return 1;
  const numbers = readdirSync(DIGEST_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'preview.md') // all issues; skip the local preview

    .map((f) => {
      const match = readFileSync(join(DIGEST_DIR, f), 'utf8').match(/^issue:\s*(\d+)/m);
      return match ? Number(match[1]) : 0;
    });
  return Math.max(0, ...numbers) + 1;
}

function isoWeekSlug(date: Date): string {
  // ISO 8601 week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${String(week).padStart(2, '0')}`;
}

const yamlEscape = (s: string) => `'${s.replace(/'/g, "''")}'`;

function renderMarkdown(digest: z.infer<typeof DigestSchema>, issue: number, date: Date): string {
  const tags = [...new Set(digest.stories.map((s) => s.tag))];
  const frontmatter = [
    '---',
    `title: ${yamlEscape(`AI Weekly #${issue} — ${digest.hook}`)}`,
    `description: ${yamlEscape(digest.description)}`,
    `date: ${date.toISOString().slice(0, 10)}`,
    `issue: ${issue}`,
    `tags: [${tags.map((t) => yamlEscape(t)).join(', ')}]`,
    'sources:',
    ...digest.stories.flatMap((s) => [
      `  - title: ${yamlEscape(s.sourceTitle)}`,
      `    url: ${yamlEscape(s.sourceUrl)}`,
    ]),
    '---',
  ].join('\n');

  const body = [
    digest.intro,
    ...digest.stories.map((s) =>
      [
        `## ${s.headline}`,
        '',
        s.summary,
        '',
        `**Why it matters:** ${s.whyItMatters} ([${s.sourceTitle}](${s.sourceUrl}))`,
      ].join('\n')
    ),
  ].join('\n\n');

  return `${frontmatter}\n\n${body}\n`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  // --preview: run the real model + validation but print the issue instead of
  // writing it, so nothing can be accidentally committed/published.
  const preview = process.argv.includes('--preview');
  // --slug <name>: override the output filename (default: ISO week). Use it to
  // publish an extra issue alongside the normal one-per-week cadence. Avoid a
  // future YYYY-WW value or it will block that week's scheduled run.
  const slugFlag = process.argv.indexOf('--slug');
  const slugOverride = slugFlag >= 0 ? process.argv[slugFlag + 1] : undefined;
  if (slugFlag >= 0 && (!slugOverride || slugOverride.startsWith('--'))) {
    throw new Error('--slug requires a name, e.g. --slug 2026-24-extra');
  }
  if (!dryRun && !process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  console.log('collecting sources …');
  const past = loadPastIssues();
  const citedBefore = new Set(past.flatMap((p) => p.urls));
  const collected = await collectFeeds();
  // Hard rule: anything a recent issue already linked never reaches the curator.
  const items = collected.filter((i) => !citedBefore.has(i.url));
  const dropped = collected.length - items.length;
  if (dropped) console.log(`↷ dropped ${dropped} item(s) already cited in issues #${past.map((p) => p.issue).join(', #')}`);
  if (items.length < 5) {
    throw new Error(`only ${items.length} items collected — refusing to generate a thin issue`);
  }
  console.log(`${items.length} items total`);

  if (dryRun) {
    console.log('\n--dry-run: skipping the model call. collected items:');
    for (const i of items) console.log(`  [${i.source}] ${i.title}`);
    return;
  }

  const issue = nextIssueNumber();
  console.log(`summarizing issue #${issue} with ${DIGEST_MODEL} …`);
  const digest = await summarize(items, issue, past);

  if (digest.stories.length < 3) {
    throw new Error(`model returned only ${digest.stories.length} stories — aborting`);
  }
  // every story must link back to a collected item — no invented URLs. The
  // sourceTitle is taken from that item too: models sometimes copy the feed
  // name ("OpenAI News") instead of the article title, and the item is the
  // source of truth anyway.
  const byUrl = new Map(items.map((i) => [i.url, i]));
  for (const story of digest.stories) {
    const item = byUrl.get(story.sourceUrl);
    if (!item) {
      throw new Error(`story "${story.headline}" cites unknown URL: ${story.sourceUrl}`);
    }
    if (story.sourceTitle !== item.title) {
      console.warn(`⚠ "${story.headline}": sourceTitle "${story.sourceTitle}" → "${item.title}"`);
      story.sourceTitle = item.title;
    }
  }

  const now = new Date();

  if (preview) {
    const markdown = renderMarkdown(digest, issue, now);
    console.log(`\n--preview: rendered issue #${issue}:\n`);
    console.log(markdown);
    writeFileSync(PREVIEW_PATH, markdown);
    console.log(`\n✓ wrote ${PREVIEW_PATH} (gitignored) — run \`npm run dev\` and open /digest/preview`);
    return;
  }

  const slug = slugOverride ?? isoWeekSlug(now);
  const path = join(DIGEST_DIR, `${slug}.md`);
  if (existsSync(path)) {
    throw new Error(`${slug}.md already exists — pass --slug <name> to write a different file`);
  }

  writeFileSync(path, renderMarkdown(digest, issue, now));
  console.log(`✓ wrote ${path} (${digest.stories.length} stories)`);
}

main().catch((err) => {
  console.error(`✗ digest generation failed: ${err.message}`);
  process.exit(1);
});
