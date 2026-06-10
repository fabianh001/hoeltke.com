/**
 * AI Weekly digest generator.
 *
 * Collects the last 7 days from curated sources (sources.json + Hacker News),
 * asks Claude to pick and summarize the top stories, and writes a new issue to
 * src/content/digest/. Fails loudly on any problem — a broken issue must never
 * be committed.
 *
 * Usage: ANTHROPIC_API_KEY=... npm run digest
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import Parser from 'rss-parser';
import { z } from 'zod';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIGEST_DIR = join(ROOT, 'src/content/digest');
const WINDOW_DAYS = 7;
const MAX_ITEMS_PER_SOURCE = 12;
const MAX_SNIPPET_CHARS = 700;

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

  // Hacker News via Algolia: high-signal AI stories from the last week
  try {
    const since = Math.floor(cutoff / 1000);
    const hn = config.hackerNews;
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(hn.query)}&tags=story&numericFilters=points>${hn.minPoints},created_at_i>${since}&hitsPerPage=20`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { hits: any[] };
    for (const hit of data.hits) {
      items.push({
        source: `Hacker News (${hit.points} points)`,
        title: hit.title,
        url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
        date: hit.created_at.slice(0, 10),
        snippet: '',
      });
    }
    console.log(`✓ Hacker News: ${data.hits.length} items`);
  } catch (err) {
    console.warn(`⚠ Hacker News failed: ${(err as Error).message}`);
  }

  return items;
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

async function summarize(items: RawItem[], issueNumber: number) {
  const client = new Anthropic();
  const itemList = items
    .map((i) => `- [${i.source}] ${i.title} (${i.date})\n  ${i.url}\n  ${i.snippet}`)
    .join('\n');

  const response = await client.messages.parse({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: `You write "AI Weekly", a sharply curated weekly digest of AI news for software engineers. Voice: direct, technically literate, a little dry-witted, zero hype. You pick only stories that will still matter in a month: model releases, meaningful research, tooling worth adopting, consequential industry/policy moves. Skip funding-round noise, product marketing, and duplicate coverage (merge duplicates into one story, citing the best source).`,
    messages: [
      {
        role: 'user',
        content: `Here is everything published in the last ${WINDOW_DAYS} days by my sources:\n\n${itemList}\n\nProduce issue #${issueNumber} of AI Weekly:
- "hook": a short, punchy issue subtitle (max 8 words, lowercase, no period) capturing the week's theme
- "description": one sentence (max 160 chars) summarizing the issue, for meta tags and the feed
- "intro": 2-3 sentences opening the issue with the week's big picture
- "stories": the top 4-6 stories. For each: "headline" (your own words), "summary" (2-3 sentences, factual, no hype), "whyItMatters" (1-2 sentences for working engineers), "sourceTitle" + "sourceUrl" (must be copied exactly from the list above), "tag" (one lowercase word, e.g. models, research, tooling, policy, infra)

Only reference stories from the list. Never invent facts or URLs.`,
      },
    ],
    output_config: { format: zodOutputFormat(DigestSchema) },
  });

  const digest = response.parsed_output;
  if (!digest) throw new Error('model returned no parsable output');
  return digest;
}

function nextIssueNumber(): number {
  if (!existsSync(DIGEST_DIR)) return 1;
  const numbers = readdirSync(DIGEST_DIR)
    .filter((f) => f.endsWith('.md'))
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
  if (!dryRun && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  console.log('collecting sources …');
  const items = await collectFeeds();
  if (items.length < 5) {
    throw new Error(`only ${items.length} items collected — refusing to generate a thin issue`);
  }
  console.log(`${items.length} items total`);

  if (dryRun) {
    console.log('\n--dry-run: skipping Claude call. sample of collected items:');
    for (const i of items.slice(0, 10)) console.log(`  [${i.source}] ${i.title}`);
    return;
  }

  const issue = nextIssueNumber();
  console.log(`summarizing issue #${issue} with Claude …`);
  const digest = await summarize(items, issue);

  if (digest.stories.length < 3) {
    throw new Error(`model returned only ${digest.stories.length} stories — aborting`);
  }
  // every story must link back to a collected item — no invented URLs
  const knownUrls = new Set(items.map((i) => i.url));
  for (const story of digest.stories) {
    if (!knownUrls.has(story.sourceUrl)) {
      throw new Error(`story "${story.headline}" cites unknown URL: ${story.sourceUrl}`);
    }
  }

  const now = new Date();
  const slug = isoWeekSlug(now);
  const path = join(DIGEST_DIR, `${slug}.md`);
  if (existsSync(path)) {
    throw new Error(`${slug}.md already exists — this week's issue was already generated`);
  }

  writeFileSync(path, renderMarkdown(digest, issue, now));
  console.log(`✓ wrote ${path} (${digest.stories.length} stories)`);
}

main().catch((err) => {
  console.error(`✗ digest generation failed: ${err.message}`);
  process.exit(1);
});
