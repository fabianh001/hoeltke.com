import { describe, it, expect } from 'vitest';
import { pcmToWav } from '../../scripts/lib/openrouter-tts';

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
