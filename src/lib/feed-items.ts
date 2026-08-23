import type { RSSFeedItem } from '@astrojs/rss';
import { renderDigestHtml } from './render-markdown';

/** Minimal shape we need from a digest collection entry. */
export interface DigestEntry {
  id: string;
  body?: string;
  data: { title: string; description: string; date: Date };
}

/** Pure mapping so it is testable without the Astro content runtime. */
export function buildFeedItems(entries: DigestEntry[], site: string): RSSFeedItem[] {
  return [...entries]
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/digest/${entry.id}/`,
      content: renderDigestHtml(entry.body ?? '', site),
    }));
}
