import { describe, expect, it } from 'vitest';
import { parseConcurrency } from '../../scripts/generate-digest-tts';

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
