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

describe('digest completion diagnostics', () => {
  it.each([false, true])('leaves output room after 8,000 reasoning tokens (format fallback: %s)', async fallback => {
    create.mockImplementation(async request => {
      if (request.max_tokens <= 8000) {
        return {
          choices: [{ finish_reason: 'length', message: { content: null } }],
          usage: { completion_tokens: 8000, completion_tokens_details: { reasoning_tokens: 8000 } },
        };
      }
      return {
        choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
          hook: 'A useful week', description: 'Weekly models.', intro: 'A useful model arrived.',
          stories: [story('https://example.com/primary')],
        }) } }],
      };
    });
    if (fallback) create.mockRejectedValueOnce(Object.assign(new Error('Unsupported schema'), { status: 400 }));

    await expect(summarize(items, 20, [])).resolves.toMatchObject({ hook: 'A useful week' });
    for (const [request] of create.mock.calls) {
      expect(request).toMatchObject({ max_tokens: 32000, reasoning: { effort: 'high' } });
    }
  });

  it('reports token exhaustion without leaking reasoning or silently retrying', async () => {
    create.mockResolvedValue({
      id: 'gen-reasoning-budget', _request_id: 'request-123',
      model: 'deepseek/deepseek-v4.1-flash-1017', provider: 'DeepSeek',
      choices: [{ finish_reason: 'length', message: { content: null, reasoning: 'private reasoning text' } }],
      usage: { prompt_tokens: 20000, completion_tokens: 8000, total_tokens: 28000, completion_tokens_details: { reasoning_tokens: 8000 } },
    });

    const error = await summarize(items, 20, []).then(
      () => { throw new Error('Expected digest generation to fail'); },
      (error: Error) => error,
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('json_schema response had empty content');
    for (const detail of ['gen-reasoning-budget', 'request-123', 'DeepSeek', '"finish_reason":"length"', '"reasoning_tokens":8000']) {
      expect(error.message).toContain(detail);
    }
    expect(error.message).not.toContain('private reasoning text');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('surfaces an upstream error returned in a successful HTTP response without choices', async () => {
    create.mockResolvedValue({
      id: 'gen-provider-failure', provider: 'DeepSeek',
      error: { code: 502, message: 'Provider disconnected', metadata: { raw: 'private provider payload' } },
    });

    const error = await summarize(items, 20, []).then(
      () => { throw new Error('Expected digest generation to fail'); },
      (error: Error) => error,
    );
    expect(error.message).toContain('gen-provider-failure');
    expect(error.message).toContain('502');
    expect(error.message).toContain('Provider disconnected');
    expect(error.message).not.toContain('private provider payload');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('includes diagnostics when the json_object fallback returns empty content', async () => {
    create.mockRejectedValueOnce(Object.assign(new Error('Unsupported schema'), { status: 400 }));
    create.mockResolvedValueOnce({
      id: 'gen-empty-json', provider: 'DeepSeek',
      choices: [{ finish_reason: 'stop', message: { content: '' } }],
      usage: { prompt_tokens: 100, completion_tokens: 0, total_tokens: 100 },
    });

    await expect(summarize(items, 20, [])).rejects.toThrow(/json_object.*gen-empty-json.*"finish_reason":"stop"/);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('continues to fall back to json_object when strict schema is rejected', async () => {
    respond([story('https://example.com/primary')]);
    create.mockRejectedValueOnce(Object.assign(new Error('Unsupported schema'), { status: 400 }));

    await expect(summarize(items, 20, [])).resolves.toMatchObject({ stories: [expect.anything()] });
    expect(create.mock.calls[1][0].response_format).toEqual({ type: 'json_object' });
  });

  it.each([401, 429, 500])('preserves HTTP %i errors without invoking the format fallback', async status => {
    const error = Object.assign(new Error('API failure'), { status });
    create.mockRejectedValue(error);

    await expect(summarize(items, 20, [])).rejects.toBe(error);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
