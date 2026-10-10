import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function validateNewsletterSlug(slug: string): string {
  if (!/^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/.test(slug) || slug === 'preview') {
    throw new Error(`Invalid newsletter slug: ${slug}`);
  }
  return slug;
}

export function pickNewsletterSlug(
  issues: { slug: string; issue: number }[],
  explicit?: string,
  changedFiles?: string[],
): string | undefined {
  let slug = explicit;
  if (!slug && changedFiles !== undefined) {
    const slugs = [...new Set(changedFiles
      .filter(file => /^src\/content\/digest\/[^/]+\.md$/.test(file) && !file.endsWith('/preview.md'))
      .map(file => file.slice('src/content/digest/'.length, -3)))];
    if (slugs.length > 1) throw new Error('Push contains multiple newsletter issues; run each explicitly by slug.');
    if (!slugs.length) return undefined;
    slug = slugs[0];
  }
  slug ||= [...issues].sort((a, b) => b.issue - a.issue)[0]?.slug;
  if (!slug) throw new Error('No issues found');
  validateNewsletterSlug(slug);
  if (!issues.some(issue => issue.slug === slug)) throw new Error(`No issue with slug ${slug}`);
  return slug;
}

export function sha256(bytes: string | Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export interface AudioManifest {
  sourceHash: string;
  audioHash: string;
}

export function readAudioManifest(path: string): AudioManifest | undefined {
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    if (/^[a-f0-9]{64}$/.test(value.sourceHash) && /^[a-f0-9]{64}$/.test(value.audioHash)) return value;
  } catch {}
  return undefined;
}

export async function verifyPublishedAudio(slug: string, expectedHash: string): Promise<string> {
  validateNewsletterSlug(slug);
  const url = `https://hoeltke.com/audio/digest/${slug}.mp3`;
  const response = await fetch(`${url}?v=${expectedHash}`, { signal: AbortSignal.timeout(60_000), cache: 'no-store' });
  if (!response.ok) throw new Error(`Published audio is unavailable (HTTP ${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (sha256(bytes) !== expectedHash) throw new Error('Published audio does not match the approved edition');
  return url;
}

/** The CLI and Actions workflow share the same guard for every real send. */
export async function verifyIssueAudio(slug: string, digestDir: string, audioDir: string): Promise<string> {
  validateNewsletterSlug(slug);
  const audioPath = join(audioDir, slug);
  const manifest = readAudioManifest(`${audioPath}.json`);
  if (!manifest || manifest.sourceHash !== sha256(readFileSync(join(digestDir, `${slug}.md`)))) {
    throw new Error('Audio fingerprint does not match the approved copy');
  }
  if (sha256(readFileSync(`${audioPath}.mp3`)) !== manifest.audioHash) throw new Error('Audio artifact is corrupt');
  return verifyPublishedAudio(slug, manifest.audioHash);
}
