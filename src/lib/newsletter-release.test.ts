import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { pickNewsletterSlug, verifyPublishedAudio, verifyIssueAudio } from '../../scripts/lib/newsletter-release';

const issues = [{ slug: '2026-40', issue: 40 }, { slug: '2026-41', issue: 41 }];
afterEach(() => vi.unstubAllGlobals());

describe('newsletter issue selection', () => {
  it('selects the older merged issue even when a newer issue exists', () => {
    expect(pickNewsletterSlug(issues, undefined, ['src/content/digest/2026-40.md'])).toBe('2026-40');
  });
  it('uses the latest issue only for a manual run without a slug', () => {
    expect(pickNewsletterSlug(issues)).toBe('2026-41');
    expect(pickNewsletterSlug(issues, undefined, [])).toBeUndefined();
    expect(pickNewsletterSlug(issues, undefined, ['src/content/digest/preview.md'])).toBeUndefined();
  });
  it('rejects ambiguous pushes, missing issues, and unsafe explicit slugs', () => {
    expect(() => pickNewsletterSlug(issues, undefined, issues.map(i => `src/content/digest/${i.slug}.md`))).toThrow(/multiple/);
    expect(() => pickNewsletterSlug(issues, '2026-39')).toThrow(/No issue/);
    expect(() => pickNewsletterSlug(issues, '../2026-40')).toThrow(/Invalid/);
  });
});

describe('published audio send gate', () => {
  const audio = Buffer.from('approved audio bytes');
  const hash = createHash('sha256').update(audio).digest('hex');
  it('accepts the exact generated audio served by the website', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(audio)));
    await expect(verifyPublishedAudio('2026-40', hash)).resolves.toBe('https://hoeltke.com/audio/digest/2026-40.mp3');
  });
  it('holds the sendout when the audio URL is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('missing', { status: 404 })));
    await expect(verifyPublishedAudio('2026-40', hash)).rejects.toThrow(/404/);
  });
  it('holds the sendout when a stale version is still served', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('old audio')));
    await expect(verifyPublishedAudio('2026-40', hash)).rejects.toThrow(/does not match/);
  });
});


describe('real send audio guard', () => {
  const directories: string[] = [];
  afterEach(() => {
    directories.forEach(path => rmSync(path, { recursive: true, force: true }));
    directories.length = 0;
  });
  function fixture() {
    const root = mkdtempSync(join(tmpdir(), 'send-audio-'));
    directories.push(root);
    const digestDir = join(root, 'digest'), audioDir = join(root, 'audio');
    mkdirSync(digestDir); mkdirSync(audioDir);
    const mdPath = join(digestDir, '2026-40.md'), audioPath = join(audioDir, '2026-40.mp3');
    const audio = Buffer.from('final narration');
    writeFileSync(mdPath, 'Final reviewed copy'); writeFileSync(audioPath, audio);
    writeFileSync(join(audioDir, '2026-40.json'), JSON.stringify({
      sourceHash: createHash('sha256').update('Final reviewed copy').digest('hex'),
      audioHash: createHash('sha256').update(audio).digest('hex'),
    }));
    return { digestDir, audioDir, mdPath, audioPath, audio };
  }
  it('holds real sends when local audio was made before the final edit', async () => {
    const { digestDir, audioDir, mdPath } = fixture();
    writeFileSync(mdPath, 'A final review edit');
    vi.stubGlobal('fetch', () => { throw new Error('verification must fail before any HTTP call'); });
    await expect(verifyIssueAudio('2026-40', digestDir, audioDir)).rejects.toThrow(/fingerprint/);
  });
  it('holds real sends when a completed audio artifact was damaged', async () => {
    const { digestDir, audioDir, audioPath } = fixture();
    writeFileSync(audioPath, 'damaged audio');
    vi.stubGlobal('fetch', () => { throw new Error('verification must fail before any HTTP call'); });
    await expect(verifyIssueAudio('2026-40', digestDir, audioDir)).rejects.toThrow(/corrupt/);
  });
  it('allows real sends only when reviewed text, local audio, and deployed audio agree', async () => {
    const { digestDir, audioDir, audio } = fixture();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(audio)));
    await expect(verifyIssueAudio('2026-40', digestDir, audioDir)).resolves.toBe('https://hoeltke.com/audio/digest/2026-40.mp3');
  });
});
