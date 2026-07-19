import { expect, test } from 'vitest';
import { buildIssueEmail } from './issue-email';

const input = {
  title: 'AI Weekly #2 — the week the agents grew up',
  description: 'six stories that mattered',
  body: '## Story one\n\nWhy it **matters**.',
  issue: 2,
  date: new Date('2026-06-19'),
};

test('builds subject and dark inline-styled HTML for an issue', () => {
  const { subject, html } = buildIssueEmail(input);
  expect(subject).toBe('AI Weekly #2 — the week the agents grew up');
  expect(html).toContain('cat ai-weekly/02.md'); // brand line, zero-padded
  expect(html).toContain('issue #02');
  expect(html).toContain('Story one'); // rendered content
  expect(html).toMatch(/<h2[^>]+style="/); // juice inlined the rules
});

test('is a full dark document with unsubscribe placeholder', () => {
  const { html } = buildIssueEmail(input);
  expect(html).toMatch(/^<!doctype html>/i);
  expect(html).toContain('{{{RESEND_UNSUBSCRIBE_URL}}}');
  expect(html).toContain('bgcolor="#000001"');
  expect(html).toContain('six stories that mattered'); // preheader
});

test('escapes HTML in the title/description', () => {
  const { subject, html } = buildIssueEmail({
    ...input,
    title: 'A <b>x</b> & y',
    description: '1 < 2',
    body: 'ok',
    issue: 1,
  });
  expect(subject).toBe('A <b>x</b> & y'); // subject is plain text, not escaped
  expect(html).toContain('A &lt;b&gt;x&lt;/b&gt; &amp; y');
  expect(html).toContain('1 &lt; 2');
});
