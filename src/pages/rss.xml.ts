import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const issues = (await getCollection('digest')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: 'AI Weekly — hoeltke.com',
    description:
      'A weekly, auto-generated digest of what actually happened in AI. Curated and summarized by a pipeline, published every Friday.',
    site: context.site!,
    items: issues.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/digest/${entry.id}/`,
    })),
    customData: '<language>en</language>',
  });
}
