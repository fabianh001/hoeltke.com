import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { synthesizeSpeech } from '../../scripts/lib/openrouter-tts';
import { parseConcurrency, processDigestTts } from '../../scripts/generate-digest-tts';

describe('digest TTS concurrency validation', () => {
  it('accepts positive integers', () => {
    expect(parseConcurrency('1')).toBe(1);
    expect(parseConcurrency('4')).toBe(4);
  });

  it('rejects values that would create zero workers', () => {
    expect(() => parseConcurrency('nope')).toThrow(/positive integer/);
    expect(() => parseConcurrency('0')).toThrow(/positive integer/);
    expect(() => parseConcurrency('-2')).toThrow(/positive integer/);
  });
});


vi.mock('../../scripts/lib/openrouter-tts', () => ({ synthesizeSpeech: vi.fn() }));

describe('digest audio retries', () => {
  const directories: string[] = [];
  afterEach(() => {
    directories.forEach(dir => rmSync(dir, { recursive: true, force: true }));
    directories.length = 0;
    vi.resetAllMocks();
  });

  function fixture() {
    const root = mkdtempSync(join(tmpdir(), 'approved-audio-'));
    directories.push(root);
    const digestDir = join(root, 'digest');
    const audioDir = join(root, 'audio');
    mkdirSync(digestDir); mkdirSync(audioDir);
    const markdown = `---\ntitle: Approved copy\ndescription: Test issue\ndate: 2026-10-09\nissue: 41\ntags: []\nsources: []\n---\nReviewed intro.\n\n## Story\nThe original summary.\n\n**Why it matters:** Useful.\n`;
    writeFileSync(join(digestDir, '2026-41.md'), markdown);
    vi.mocked(synthesizeSpeech).mockImplementation(async (text, options) => {
      const bytes = Buffer.from(text);
      writeFileSync(options!.outputFilePath!, bytes);
      return bytes;
    });
    const options = { slug: '2026-41', dryRun: false, force: false, useAiScript: false, digestDir, audioDir };
    return { options, markdown, mdPath: join(digestDir, '2026-41.md'), audioPath: join(audioDir, '2026-41.mp3') };
  }

  it('reuses completed audio for an unchanged reviewed issue without calling TTS', async () => {
    const { options, audioPath } = fixture();
    await processDigestTts(options);
    const first = readFileSync(audioPath);
    vi.mocked(synthesizeSpeech).mockRejectedValue(new Error('TTS must not be called on retry'));
    await processDigestTts(options);
    expect(readFileSync(audioPath)).toEqual(first);
  });

  it('regenerates existing audio after review edits', async () => {
    const { options, markdown, mdPath, audioPath } = fixture();
    await processDigestTts(options);
    writeFileSync(mdPath, markdown.replace('original summary', 'final edited summary'));
    await processDigestTts(options);
    expect(readFileSync(audioPath, 'utf8')).toContain('final edited summary');
  });

  it('regenerates legacy audio without a content fingerprint', async () => {
    const { options, audioPath } = fixture();
    writeFileSync(audioPath, 'pre-review audio');
    await processDigestTts(options);
    expect(readFileSync(audioPath, 'utf8')).toContain('original summary');
  });

  it('propagates generation failure and does not mark stale audio reusable', async () => {
    const { options, markdown, mdPath, audioPath } = fixture();
    await processDigestTts(options);
    writeFileSync(mdPath, markdown.replace('original summary', 'final edited summary'));
    vi.mocked(synthesizeSpeech).mockRejectedValueOnce(new Error('generation failed'));
    await expect(processDigestTts(options)).rejects.toThrow('generation failed');
    await processDigestTts(options);
    expect(readFileSync(audioPath, 'utf8')).toContain('final edited summary');
  });

  it('does not mark an empty generated file as completed audio', async () => {
    const { options, audioPath } = fixture();
    vi.mocked(synthesizeSpeech).mockImplementation(async () => {
      writeFileSync(audioPath, '');
      return Buffer.alloc(0);
    });
    await expect(processDigestTts(options)).rejects.toThrow(/empty/);
    expect(existsSync(audioPath.replace(/\.mp3$/, '.json'))).toBe(false);
  });

  it('regenerates a corrupted cached audio file' , async () => {
    const { options, audioPath } = fixture();
    await processDigestTts(options);
    writeFileSync(audioPath, 'truncated');
    await processDigestTts(options);
    expect(readFileSync(audioPath, 'utf8')).toContain('original summary');
  });
});
