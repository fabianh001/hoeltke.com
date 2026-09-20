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
  const items = buildFeedItems(entries as any, SITE, '/nonexistent-audio-dir');
  expect(items).toHaveLength(2);
  expect(items[0].title).toBe('AI Weekly #5'); // newest first despite input order
  expect(items[1].title).toBe('AI Weekly #4');
  expect(items[0].description).toBe('the week in AI');
  expect(items[0].link).toBe('/digest/2026-30/');
  expect(items[0].content).toContain('<h2>Story one</h2>');
  expect(items[0].enclosure).toBeUndefined();
});

test('attaches audio enclosure when entry specifies audio or file exists', () => {
  const entriesWithAudio = [
    {
      id: '2026-34',
      body: '## Story',
      data: {
        title: 'AI Weekly #11',
        description: 'pacing',
        date: new Date('2026-08-21'),
      },
    },
    {
      id: '2026-35',
      body: '## Another Story',
      data: {
        title: 'AI Weekly #12',
        description: 'models',
        date: new Date('2026-08-28'),
        audio: 'https://cdn.example.com/audio/2026-35.mp3',
      },
    },
  ];

  const items = buildFeedItems(entriesWithAudio as any, SITE);
  // 2026-35 has explicit audio URL
  expect(items[0].enclosure).toEqual({
    url: 'https://cdn.example.com/audio/2026-35.mp3',
    length: 0,
    type: 'audio/mpeg',
  });

  // 2026-34 has public/audio/digest/2026-34.mp3 on disk
  expect(items[1].enclosure).toBeDefined();
  expect(items[1].enclosure?.url).toBe('https://hoeltke.com/audio/digest/2026-34.mp3');
  expect(items[1].enclosure?.type).toBe('audio/mpeg');
  expect(items[1].enclosure?.length).toBeGreaterThan(1000);
});
