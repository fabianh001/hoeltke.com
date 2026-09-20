import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { buildFeedItems } from '../lib/feed-items';

export async function GET(context: APIContext) {
  const entries = await getCollection('digest');
  return rss({
    title: 'AI Weekly — hoeltke.com',
    description:
      'A weekly, auto-generated digest of what actually happened in AI. Curated and summarized by a pipeline, published every Friday.',
    site: context.site!,
    items: buildFeedItems(entries, context.site!.toString()),
    xmlns: {
      itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
    },
    customData: [
      '<language>en</language>',
      '<itunes:author>Fabian Höltke</itunes:author>',
      `<itunes:image href="${new URL('/og/default.png', context.site).toString()}" />`,
      '<itunes:category text="Technology"><itunes:category text="Artificial Intelligence"/></itunes:category>',
      '<itunes:explicit>false</itunes:explicit>',
    ].join(''),
  });
}
