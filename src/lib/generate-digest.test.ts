import { afterEach, describe, expect, it, vi } from 'vitest';
import { summarize, renderMarkdown } from '../../scripts/generate-digest';
import { rankCandidates } from '../../scripts/lib/digest-traction';
import { checkNewsletterGuidelines } from './newsletter-guidelines';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('openai', () => ({ default: class { chat = { completions: { create } }; } }));

afterEach(() => vi.resetAllMocks());

const items = rankCandidates([
  { source: 'Primary blog', title: 'Primary announcement', url: 'https://example.com/primary', date: '2026-10-20', snippet: 'Primary details.' },
  { source: 'Hacker News', title: 'Popular analysis', url: 'https://example.com/analysis', date: '2026-10-20', snippet: '', hn: [{ id: '1', points: 500, comments: 100 }] },
  { source: 'Hacker News', title: 'Other model', url: 'https://example.com/other', date: '2026-10-20', snippet: '', hn: [{ id: '2', points: 300, comments: 50 }] },
]);

const story = (sourceUrl: string, relatedSourceUrls: string[] = []) => ({
  headline: 'A useful development', summary: 'A model was released.', whyItMatters: 'You can evaluate it.',
  sourceTitle: 'Model used the wrong title', sourceUrl, relatedSourceUrls, tag: 'models',
});

function respond(stories = [story('https://example.com/other'), story('https://example.com/primary', ['https://example.com/analysis'])]) {
  create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ hook: 'the week', description: 'Weekly models.', intro: 'This week brought useful models.', stories }) } }] });
}

describe('digest generation policy', () => {
  it('supplies private traction to the curator and orders grouped developments while preserving primary citations', async () => {
    respond();
    const digest = await summarize(items, 20, []);
    expect(digest.stories.map(s => s.sourceUrl)).toEqual(['https://example.com/primary', 'https://example.com/other']);
    expect(digest.stories[0].sourceTitle).toBe('Primary announcement');
    const prompt = create.mock.calls[0][0].messages.map((m: { content: string }) => m.content).join('\n');
    expect(prompt).toContain('525');
    expect(prompt).toContain('800');
    expect(prompt).toContain('600–700');
    expect(prompt).toContain('AI relevance');
    const markdown = renderMarkdown(digest, 20, new Date('2026-10-22T07:00:00Z'));
    expect(markdown).not.toContain('relatedSourceUrls');
    expect(markdown).not.toContain('525');
  });

  it('warns on an oversized generated draft without rejecting or truncating it', async () => {
    const stories = Array.from({ length: 6 }, () => ({ ...story('https://example.com/primary'), summary: 'word '.repeat(140) }));
    respond(stories);
    const digest = await summarize(items, 20, []);
    expect(digest.stories).toHaveLength(6);
    const body = digest.stories.map(s => `## ${s.headline}\n\n${s.summary}`).join('\n\n');
    expect(checkNewsletterGuidelines({ body }).warnings).toHaveLength(2);
  });

  it('still rejects invented source URLs and invented related selection evidence', async () => {
    respond([story('https://example.com/invented')]);
    await expect(summarize(items, 20, [])).rejects.toThrow(/unknown URL/);
    respond([story('https://example.com/primary', ['https://example.com/invented'])]);
    await expect(summarize(items, 20, [])).rejects.toThrow(/unknown selection URL/);
  });

  it('allows fewer stories in a quiet week', async () => {
    respond([story('https://example.com/primary')]);
    await expect(summarize(items, 20, [])).resolves.toMatchObject({ stories: [expect.anything()] });
  });
});
