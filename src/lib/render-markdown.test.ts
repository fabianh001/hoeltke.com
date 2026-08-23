import { expect, test } from 'vitest';
import { renderDigestHtml } from './render-markdown';

const SITE = 'https://hoeltke.com';

test('renders headings, paragraphs and bold', () => {
  const html = renderDigestHtml('## Story\n\nA **big** deal.', SITE);
  expect(html).toContain('<h2>Story</h2>');
  expect(html).toContain('<strong>big</strong>');
});

test('keeps absolute links as-is', () => {
  const html = renderDigestHtml('[src](https://example.com/x)', SITE);
  expect(html).toContain('href="https://example.com/x"');
});

test('rewrites relative links to absolute against the site', () => {
  const html = renderDigestHtml('[feed](/rss.xml)', SITE);
  expect(html).toContain('href="https://hoeltke.com/rss.xml"');
});

test('strips disallowed tags (script)', () => {
  const html = renderDigestHtml('ok\n\n<script>alert(1)</script>', SITE);
  expect(html).not.toContain('<script>');
});

test('does not throw on a malformed link (AI-generated content)', () => {
  expect(() => renderDigestHtml('[bad](http://[::1)', SITE)).not.toThrow();
});
