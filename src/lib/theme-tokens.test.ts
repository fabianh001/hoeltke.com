import { expect, test } from 'vitest';
import { themeTokens } from './theme-tokens';

test('extracts hex tokens from global.css :root', () => {
  const t = themeTokens();
  expect(t.line).toBe('#e5e5e5');
  expect(t.accent).toBe('#181818');
  expect(t.green).toBe('#181818');
  expect(t['term-bg']).toBe('#050507');
});

test('exports the light palette with email-safe white', () => {
  const t = themeTokens();
  expect(t.bg).toBe('#fffffe');
  expect(t.text).toBe('#181818');
  expect(t['status-green']).toBe('#01a240');
});

test('skips non-hex tokens instead of mangling them', () => {
  const t = themeTokens();
  expect(t.dot).toBeUndefined(); // rgba() in global.css
  expect(t.glow).toBeUndefined();
});
