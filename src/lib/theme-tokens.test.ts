import { expect, test } from 'vitest';
import { themeTokens } from './theme-tokens';

test('extracts hex tokens from global.css :root', () => {
  const t = themeTokens();
  expect(t.line).toBe('#222228');
  expect(t.accent).toBe('#9050ff');
  expect(t.green).toBe('#3ef78f');
  expect(t['term-bg']).toBe('#050507');
});

test('maps pure black/white to email-safe near-values', () => {
  const t = themeTokens();
  expect(t.bg).toBe('#000001'); // site: #000000
  expect(t.text).toBe('#fffffe'); // site: #ffffff
});

test('skips non-hex tokens instead of mangling them', () => {
  const t = themeTokens();
  expect(t.dot).toBeUndefined(); // rgba() in global.css
  expect(t.glow).toBeUndefined();
});
