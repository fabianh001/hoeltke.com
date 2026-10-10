/** Resolve the approved issue or verify its deployed audio. No email is sent here. */
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { pickNewsletterSlug, verifyIssueAudio } from './lib/newsletter-release.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const digestDir = join(ROOT, 'src/content/digest');

async function main() {
  if (process.argv[2] === 'verify') {
    if (!process.env.SLUG) throw new Error('Issue slug is required');
    const slug = pickNewsletterSlug(loadIssues(), process.env.SLUG)!;
    const url = await verifyIssueAudio(slug, digestDir, join(ROOT, 'public/audio/digest'));
    console.log(`✓ Audio ready: ${url}`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Audio ready: [Listen](${url})\n`);
    return;
  }
  const changedFiles = process.env.GITHUB_EVENT_NAME === 'push'
    ? execFileSync('git', ['diff', '--diff-filter=AM', '--name-only', process.env.BEFORE!, process.env.SOURCE_SHA!, '--', 'src/content/digest'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
    : undefined;
  const slug = pickNewsletterSlug(loadIssues(), process.env.INPUT_SLUG, changedFiles);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug ?? ''}\n`);
  console.log(slug ? `Approved issue: ${slug}` : 'No newsletter issue to send');
}

function loadIssues() {
  return readdirSync(digestDir).filter(file => file.endsWith('.md') && file !== 'preview.md').map(file => ({
    slug: file.slice(0, -3), issue: matter(readFileSync(join(digestDir, file), 'utf8')).data.issue as number,
  }));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
