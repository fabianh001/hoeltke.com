import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { pcmToWav, synthesizeSpeech, validateBitrate } from '../../scripts/lib/openrouter-tts';

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('openrouter-tts pcmToWav', () => {
  it('encodes raw PCM buffer with a standard 44-byte RIFF WAV header', () => {
    // 24000 samples/sec * 1 channel * 2 bytes/sample * 0.1 sec = 4800 bytes
    const dummyPcm = Buffer.alloc(4800, 0);
    const wav = pcmToWav(dummyPcm, 24000, 1, 16);

    expect(wav.length).toBe(4800 + 44);
    expect(wav.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(wav.subarray(8, 12).toString('ascii')).toBe('WAVE');
    expect(wav.subarray(12, 16).toString('ascii')).toBe('fmt ');
    expect(wav.readUInt32LE(24)).toBe(24000); // sampleRate
    expect(wav.readUInt16LE(22)).toBe(1); // mono
    expect(wav.readUInt16LE(34)).toBe(16); // 16-bit
    expect(wav.subarray(36, 40).toString('ascii')).toBe('data');
    expect(wav.readUInt32LE(40)).toBe(4800); // data length
  });
});

describe('openrouter-tts bitrate validation', () => {
  it('accepts ffmpeg bitrate values without shell metacharacters', () => {
    expect(validateBitrate('64k')).toBe('64k');
    expect(validateBitrate('128K')).toBe('128K');
  });

  it('rejects malformed or injectable bitrate values', () => {
    expect(() => validateBitrate('64k; touch /tmp/pwned')).toThrow(/Invalid TTS bitrate/);
    expect(() => validateBitrate('not-a-bitrate')).toThrow(/Invalid TTS bitrate/);
  });
});

describe('openrouter-tts output safety', () => {
  it('fails without writing a mislabeled MP3 when ffmpeg conversion fails', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'digest-tts-'));
    const outputPath = join(directory, 'episode.mp3');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(Buffer.alloc(64), { status: 200 })));
    vi.mocked(spawnSync).mockReturnValue({
      status: 1,
      stderr: Buffer.from('encoder failed'),
    } as ReturnType<typeof spawnSync>);

    try {
      await expect(
        synthesizeSpeech('Test narration.', {
          apiKey: 'test-key',
          responseFormat: 'pcm',
          outputFilePath: outputPath,
        }),
      ).rejects.toThrow(/ffmpeg compression to MP3 failed/);
      expect(existsSync(outputPath)).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
