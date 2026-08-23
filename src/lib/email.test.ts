import { expect, test } from 'vitest';
import { isValidEmail } from './email';

test('accepts a normal address', () => {
  expect(isValidEmail('fabian@hoeltke.com')).toBe(true);
});

test('rejects malformed addresses', () => {
  for (const bad of ['', 'nope', 'a@b', 'a b@c.com', '@x.com', 'x@y']) {
    expect(isValidEmail(bad)).toBe(false);
  }
});
