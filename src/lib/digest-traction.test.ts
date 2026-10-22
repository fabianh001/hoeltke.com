import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  collectHackerNews,
  excludePreviouslyCited,
  normalizeStoryUrl,
  orderStoriesByTraction,
  rankCandidates,
  tractionScore,
  type DigestCandidate,
} from '../../scripts/lib/digest-traction';

const candidate = (url: string, points?: number, comments = 0): DigestCandidate => ({
  source: points === undefined ? 'Research blog' : 'Hacker News',
  title: `Article ${url}`,
  url,
  date: '2026-10-20',
  snippet: points === undefined ? 'Original research context.' : '',
  ...(points === undefined ? {} : { hn: [{ id: url, points, comments }] }),
});

afterEach(() => vi.unstubAllGlobals());

describe('weekly traction ranking', () => {
  it('uses votes with a bounded discussion bonus', () => {
    expect(tractionScore(candidate('https://example.com', 400, 80))).toBe(420);
    expect(tractionScore(candidate('https://example.com', 100, 10_000))).toBe(125);
    expect(tractionScore(candidate('https://example.com'))).toBe(0);
  });

  it('merges tracking variants without losing the feed article or counting repeat threads twice', () => {
    const original = candidate('https://example.com/release/#announcement');
    const hn = candidate('http://example.com/release?utm_source=hn#announcement', 400, 80);
    const ranked = rankCandidates([hn, original, hn, candidate('https://example.com/release#announcement', 200, 20)]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({
      source: original.source, title: original.title, url: original.url,
      snippet: original.snippet, tractionScore: 420,
    });
    expect(ranked[0].hn).toHaveLength(2);
  });

  it('preserves meaningful query parameters when matching articles', () => {
    expect(normalizeStoryUrl('https://example.com/?id=1&utm_medium=rss')).toBe(normalizeStoryUrl('https://example.com?id=1'));
    expect(normalizeStoryUrl('https://example.com/?id=1')).not.toBe(normalizeStoryUrl('https://example.com/?id=2'));
  });

  it('keeps distinct archive announcements and their traction separate', () => {
    const earlier = candidate('https://www.php.net/archive/2026.php#2026-10-20-1', 500, 100);
    const fresh = candidate('https://www.php.net/archive/2026.php#2026-10-21-5', 200, 20);
    expect(rankCandidates([earlier, fresh]).map(({ url, tractionScore }) => ({ url, tractionScore }))).toEqual([
      { url: earlier.url, tractionScore: 525 },
      { url: fresh.url, tractionScore: 205 },
    ]);
  });

  it('keeps a fresh archive entry when a different entry was already cited', () => {
    const earlier = candidate('https://www.php.net/archive/2026.php#2026-10-20-1', 500, 100);
    const fresh = candidate('https://www.php.net/archive/2026.php#2026-10-21-5', 200, 20);
    const remaining = excludePreviouslyCited(rankCandidates([earlier, fresh]), [
      'https://www.php.net/archive/2026.php?utm_source=newsletter#2026-10-20-1',
    ]);
    expect(remaining).toEqual([expect.objectContaining({ url: fresh.url, tractionScore: 205 })]);
  });

  it('orders by traction, with unmeasured candidates last and stable ties', () => {
    const low = candidate('https://example.com/low', 200, 0);
    const high = candidate('https://example.com/high', 190, 100);
    const unknown = candidate('https://example.com/unmeasured');
    expect(rankCandidates([unknown, low, high]).map(i => i.url)).toEqual([high.url, low.url, unknown.url]);
    expect(rankCandidates([low, unknown]).map(i => i.url)).toEqual(rankCandidates([unknown, low]).map(i => i.url));
  });

  it('ranks a development by its strongest related article while keeping the primary citation', () => {
    const items = rankCandidates([
      candidate('https://example.com/primary'),
      candidate('https://example.com/analysis', 500, 100),
      candidate('https://example.com/other', 300, 50),
    ]);
    const stories = [
      { sourceUrl: items[1].url, relatedSourceUrls: [] },
      { sourceUrl: 'https://example.com/primary', relatedSourceUrls: ['https://example.com/analysis'] },
    ];
    const ordered = orderStoriesByTraction(stories, items);
    expect(ordered[0].sourceUrl).toBe('https://example.com/primary');
    expect(stories[0].sourceUrl).toBe('https://example.com/other');
  });
});

describe('HN collection', () => {
  const now = new Date('2026-10-22T07:00:00Z');
  const cutoff = new Date('2026-10-15T07:00:00Z');
  const hit = (id: string, date: Date, points = 200, comments = 20, url = `https://example.com/${id}`) => ({
    objectID: id, title: `Story ${id}`, url, points, num_comments: comments,
    created_at: date.toISOString(), created_at_i: date.getTime() / 1000,
  });

  it('paginates the weekly sample and retains points and comments for ranking', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ hits: [hit('one', cutoff, 400, 80)], nbPages: 2 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ hits: [hit('two', now, 500, 200)], nbPages: 2 })));
    vi.stubGlobal('fetch', fetchMock);
    const items = await collectHackerNews({ minPoints: 150 }, cutoff, now);
    expect(items).toHaveLength(2);
    expect(items[0].hn).toEqual([{ id: 'one', points: 400, comments: 80 }]);
    const urls = fetchMock.mock.calls.map(([url]) => new URL(url));
    expect(urls.map(url => url.searchParams.get('page'))).toEqual(['0', '1']);
    expect(urls[0].searchParams.get('numericFilters')).toContain(`created_at_i>=${cutoff.getTime() / 1000}`);
    expect(urls[0].searchParams.get('numericFilters')).toContain(`created_at_i<=${now.getTime() / 1000}`);
  });

  it('excludes stale, future, low-score, and malformed hits and supplies discussion links', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ hits: [
      hit('old', new Date(cutoff.getTime() - 1000)),
      hit('future', new Date(now.getTime() + 1000)),
      hit('low', now, 10),
      { ...hit('bad-date', now), created_at: 'invalid', created_at_i: undefined },
      { ...hit('missing-title', now), title: null },
      hit('discussion', now, 300, 60, ''),
    ], nbPages: 1 }))));
    const items = await collectHackerNews({ minPoints: 150 }, cutoff, now);
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://news.ycombinator.com/item?id=discussion');
    expect(items[0].hn![0].comments).toBe(60);
  });

  it('reports API failure so the caller can fall back to feeds explicitly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })));
    await expect(collectHackerNews({ minPoints: 150 }, cutoff, now)).rejects.toThrow(/503/);
  });
});
