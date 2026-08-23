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
    customData: '<language>en</language>',
  });
}
