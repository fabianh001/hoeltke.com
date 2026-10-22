export interface HnSignal {
  id: string;
  points: number;
  comments: number;
}

export interface DigestCandidate {
  source: string;
  title: string;
  url: string;
  date: string;
  snippet: string;
  hn?: HnSignal[];
}

export type RankedCandidate = DigestCandidate & { tractionScore: number };

/** Match feed and HN URLs while preserving query parameters and content-bearing fragments. */
export function normalizeStoryUrl(value: string): string {
  try {
    const url = new URL(value);
    url.protocol = 'https:';
    // Fragments can identify separate archive entries or hash-routed pages.
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || /^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.href;
  } catch {
    return value;
  }
}

/** Apply the same story identity to recent citations and collected candidates. */
export function excludePreviouslyCited(items: RankedCandidate[], citedUrls: string[]): RankedCandidate[] {
  const cited = new Set(citedUrls.map(normalizeStoryUrl));
  return items.filter(item => !cited.has(normalizeStoryUrl(item.url)));
}

const threadScore = ({ points, comments }: HnSignal) => points + 0.25 * Math.min(comments, points);

/** Use the strongest thread, so reposting an article doesn't inflate its rank. */
export function tractionScore(item: DigestCandidate): number {
  return Math.max(0, ...(item.hn ?? []).map(threadScore));
}

export function rankCandidates(items: DigestCandidate[]): RankedCandidate[] {
  const byUrl = new Map<string, DigestCandidate>();
  for (const item of items) {
    const key = normalizeStoryUrl(item.url);
    const previous = byUrl.get(key);
    const preferred = previous && previous.source !== 'Hacker News' ? previous : item;
    const threads = new Map<string, HnSignal>();
    for (const signal of [...(previous?.hn ?? []), ...(item.hn ?? [])]) {
      const existing = threads.get(signal.id);
      if (!existing || threadScore(signal) > threadScore(existing)) threads.set(signal.id, signal);
    }
    byUrl.set(key, { ...preferred, hn: [...threads.values()] });
  }
  return [...byUrl.values()]
    .map(item => ({ ...item, tractionScore: tractionScore(item) }))
    .sort((a, b) => b.tractionScore - a.tractionScore || b.date.localeCompare(a.date) || a.url.localeCompare(b.url));
}

/** A story can cite the primary announcement while inheriting its related coverage's traction. */
export function orderStoriesByTraction<T extends { sourceUrl: string; relatedSourceUrls: string[] }>(
  stories: T[], items: RankedCandidate[],
): T[] {
  const byUrl = new Map(items.map(item => [item.url, item.tractionScore]));
  const score = (story: T) => Math.max(0, ...[story.sourceUrl, ...story.relatedSourceUrls].map(url => {
    const value = byUrl.get(url);
    if (value === undefined) throw new Error(`story cites unknown selection URL: ${url}`);
    return value;
  }));
  return stories.map(story => ({ story, score: score(story) }))
    .sort((a, b) => b.score - a.score)
    .map(({ story }) => story);
}

interface HnHit {
  objectID?: string;
  title?: string;
  url?: string;
  created_at?: string;
  created_at_i?: number;
  points?: number;
  num_comments?: number;
}

/** Scores at collection time for submissions in this window, not historical vote deltas. */
export async function collectHackerNews(
  config: { minPoints: number }, cutoff: Date, now: Date,
): Promise<DigestCandidate[]> {
  const items: DigestCandidate[] = [];
  // Algolia exposes at most 1,000 hits per search. Read all available pages
  // before ranking, so the first page's order doesn't dictate our shortlist.
  const maxPages = 10;
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      tags: 'story',
      numericFilters: `points>=${config.minPoints},created_at_i>=${Math.floor(cutoff.getTime() / 1000)},created_at_i<=${Math.floor(now.getTime() / 1000)}`,
      hitsPerPage: '100', page: String(page),
    });
    const response = await fetch(`https://hn.algolia.com/api/v1/search?${params}`, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as { hits: HnHit[]; nbPages: number };
    if (!Array.isArray(data.hits)) throw new Error('Hacker News returned no hits array');
    for (const hit of data.hits) {
      if (!hit || typeof hit.title !== 'string' || !hit.title.trim() || !hit.objectID) continue;
      const timestamp = typeof hit.created_at_i === 'number'
        ? hit.created_at_i * 1000 : Date.parse(hit.created_at ?? '');
      if (!Number.isFinite(timestamp) || timestamp < cutoff.getTime() || timestamp > now.getTime()) continue;
      const points = Number.isFinite(hit.points) ? Math.max(0, hit.points!) : 0;
      const comments = Number.isFinite(hit.num_comments) ? Math.max(0, hit.num_comments!) : 0;
      if (points < config.minPoints) continue;
      const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      if (!/^https?:\/\//i.test(url)) continue;
      items.push({
        source: 'Hacker News', title: hit.title, url,
        date: new Date(timestamp).toISOString().slice(0, 10), snippet: '',
        hn: [{ id: hit.objectID, points, comments }],
      });
    }
    if (!data.hits.length || page + 1 >= (data.nbPages || 1)) break;
    if (page === maxPages - 1) console.warn('⚠ HN search truncated at 1,000 submissions; traction covers this sample only.');
  }
  return items;
}
