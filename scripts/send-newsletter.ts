/**
 * Send the newest AI Weekly issue to subscribers as a Resend Broadcast.
 * Run by weekly-digest.yml after publish.
 *
 * Usage:
 *   npm run send-newsletter -- --dry-run        # build + print, no API call (no key needed)
 *   npm run send-newsletter -- --draft          # create the broadcast but DON'T send (test from the Resend dashboard)
 *   npm run send-newsletter -- --slug 2026-25   # target a specific issue
 *   npm run send-newsletter                     # create + send to the segment now
 *
 * Env: RESEND_API_KEY, RESEND_SEGMENT_ID; optional RESEND_REPLY_TO
 * (unset → replies go to the from address).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { buildIssueEmail } from '../src/lib/issue-email';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIGEST_DIR = join(ROOT, 'src/content/digest');
const API = 'https://api.resend.com';
const FROM = 'AI Weekly <ai-weekly@mail.hoeltke.com>';
const REPLY_TO = process.env.RESEND_REPLY_TO; // keep the personal mailbox out of the repo

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const draft = args.includes('--draft');
const slug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : undefined;

interface Loaded {
  slug: string;
  data: { title: string; description: string; date: string; issue: number };
  body: string;
}

function loadIssues(): Loaded[] {
  return readdirSync(DIGEST_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'preview.md')
    .map((f) => {
      const parsed = matter(readFileSync(join(DIGEST_DIR, f), 'utf8'));
      return { slug: f.replace(/\.md$/, ''), data: parsed.data as Loaded['data'], body: parsed.content };
    });
}

function pickIssue(): Loaded {
  const issues = loadIssues();
  const chosen = slug
    ? issues.find((i) => i.slug === slug)
    : issues.sort((a, b) => b.data.issue - a.data.issue)[0];
  if (!chosen) throw new Error(slug ? `No issue with slug ${slug}` : 'No issues found');
  return chosen;
}

function headers(key: string) {
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

/**
 * True if a broadcast for this issue already went out (idempotent re-runs).
 * Drafts (e.g. tests) never block a later real send. Best-effort: a query
 * error must not block sending.
 */
async function alreadySent(name: string, key: string): Promise<boolean> {
  const res = await fetch(`${API}/broadcasts?limit=100`, { headers: headers(key) });
  if (!res.ok) return false;
  const data = (await res.json()) as { data?: { name: string; status: string }[] };
  return (data.data ?? []).some((b) => b.name === name && b.status !== 'draft');
}

async function main() {
  const issue = pickIssue();
  const { subject, html } = buildIssueEmail({
    title: issue.data.title,
    description: issue.data.description,
    body: issue.body,
    issue: issue.data.issue,
    date: new Date(issue.data.date),
  });
  const name = `ai-weekly-${issue.slug}`;

  if (dryRun) {
    const verb = draft ? 'create a draft broadcast for' : 'send';
    console.log(`[dry-run] would ${verb} "${subject}" as ${name} (${html.length} bytes of HTML)`);
    return;
  }

  const key = process.env.RESEND_API_KEY;
  const segment = process.env.RESEND_SEGMENT_ID;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  if (!segment) throw new Error('RESEND_SEGMENT_ID is not set');

  if (!draft && (await alreadySent(name, key))) {
    console.log(`✓ "${subject}" was already sent — skipping.`);
    return;
  }

  const res = await fetch(`${API}/broadcasts`, {
    method: 'POST',
    headers: headers(key),
    body: JSON.stringify({
      segment_id: segment,
      from: FROM,
      reply_to: REPLY_TO,
      subject,
      name,
      html,
      send: !draft,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  console.log(draft ? `✓ created draft broadcast "${subject}".` : `✓ sent "${subject}" to subscribers.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
