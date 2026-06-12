import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const site = context.site!.toString().replace(/\/$/, '');
  const issues = (await getCollection('digest')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  const lines = [
    '# hoeltke.com',
    '',
    '> AI Weekly — an auto-generated weekly digest of what actually happened in AI.',
    '> A pipeline collects the week from curated sources, Claude picks and summarizes',
    '> the stories that matter, and the result is published every Friday with all',
    '> sources linked. Built and run by Fabian Hoeltke (AI Engineer @ Datadog).',
    '',
    '## Issues',
    '',
    ...issues.map(
      (e) =>
        `- [${e.data.title}](${site}/digest/${e.id}/): ${e.data.description}`
    ),
    '',
    '## Pages',
    '',
    `- [All issues](${site}/digest)`,
    `- [About](${site}/about): who runs this`,
    `- [RSS feed](${site}/rss.xml)`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
