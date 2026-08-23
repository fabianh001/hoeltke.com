import { expect, test } from 'vitest';
import { buildFeedItems } from './feed-items';

const SITE = 'https://hoeltke.com';

const entries = [
  {
    id: '2026-20',
    body: 'older issue',
    data: {
      title: 'AI Weekly #4',
      description: 'last week',
      date: new Date('2026-05-15'),
    },
  },
  {
    id: '2026-30',
    body: '## Story one\n\nWhy it matters.',
    data: {
      title: 'AI Weekly #5',
      description: 'the week in AI',
      date: new Date('2026-07-24'),
    },
  },
];

test('maps entries to rss items with full HTML content, newest first', () => {
  const items = buildFeedItems(entries as any, SITE);
  expect(items).toHaveLength(2);
  expect(items[0].title).toBe('AI Weekly #5'); // newest first despite input order
  expect(items[1].title).toBe('AI Weekly #4');
  expect(items[0].description).toBe('the week in AI');
  expect(items[0].link).toBe('/digest/2026-30/');
  expect(items[0].content).toContain('<h2>Story one</h2>');
});
