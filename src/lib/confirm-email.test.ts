import { expect, test } from 'vitest';
import { buildConfirmEmail } from './confirm-email';

test('builds a light confirmation email with the confirm_url placeholder', () => {
  const { subject, html } = buildConfirmEmail();
  expect(subject).toBe('confirm your subscription');
  expect(html).toMatch(/^<!doctype html>/i);
  expect(html).toContain('href="{{confirm_url}}"');
  expect(html).toContain('bgcolor="#fffffe"');
  expect(html).toContain('48 h'); // expiry notice
});
