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
const classification = [
  { candidateIds: [2], primaryCandidateId: 2, eligible: true, reason: 'AI model release.' },
  { candidateIds: [1, 3], primaryCandidateId: 3, eligible: true, reason: 'One AI development with primary announcement and analysis.' },
];
const onlyPrimary = classification.map(g => ({ ...g, eligible: g.primaryCandidateId === 3 }));
const story = (developmentId: number) => ({
  developmentId, headline: 'A useful development', summary: 'A model was released.',
  whyItMatters: 'You can evaluate it.', tag: 'models',
});
const response = (value: unknown) => ({ choices: [{ message: { content: JSON.stringify(value) } }] });
const issue = (stories = [story(1), story(2)]) => ({ hook: 'A useful week', description: 'Weekly models.', intro: 'This week brought useful models.', stories });

function respond(stories = [story(1), story(2)], groups = classification) {
  let phase = 0;
  create.mockImplementation(async () => response(phase++ === 0 ? { groups } : issue(stories)));
}

describe('digest generation policy', () => {
  it('classifies before writing and attaches authoritative citations in traction order', async () => {
    respond();
    const digest = await summarize(items, 20, []);
    expect(digest.stories.map(s => s.sourceUrl)).toEqual(['https://example.com/primary', 'https://example.com/other']);
    expect(digest.stories[0]).toMatchObject({ sourceTitle: 'Primary announcement', relatedSourceUrls: ['https://example.com/analysis'] });
    const markdown = renderMarkdown(digest, 20, new Date('2026-10-22T07:00:00Z'));
    expect(markdown).not.toContain('developmentId');
    expect(markdown).not.toContain('525');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('accepts long written copy while returning advisory reading warnings', async () => {
    respond([1, 2].map(id => ({ ...story(id), summary: 'word '.repeat(450) })));
    const digest = await summarize(items, 20, []);
    expect(digest.stories).toHaveLength(2);
    expect(digest.stories[0].summary).toBe('word '.repeat(450));
    const body = digest.stories.map(s => `## ${s.headline}\n\n${s.summary}`).join('\n\n');
    expect(checkNewsletterGuidelines({ body }).warnings).toHaveLength(1);
  });

  it.each([
    { name: 'omits', stories: [story(2)], error: /missing selected development/ },
    { name: 'duplicates', stories: [story(2), story(2)], error: /duplicate development/ },
    { name: 'substitutes', stories: [story(2), story(99)], error: /unselected development/ },
  ])('rejects a writer that $name a selected story', async ({ stories, error }) => {
    respond(stories);
    await expect(summarize(items, 20, [])).rejects.toThrow(error);
  });

  it('does not call the writer if classification silently omits a candidate', async () => {
    respond([story(2)], classification.slice(1));
    await expect(summarize(items, 20, [])).rejects.toThrow(/omitted candidate/);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('allows fewer stories in a quiet week', async () => {
    respond([story(2)], onlyPrimary);
    await expect(summarize(items, 20, [])).resolves.toMatchObject({ stories: [expect.anything()] });
  });

  it.each([false, true])('keeps eligible PHP in the top five (writer attempts replacement: %s)', async replacement => {
    const pool = rankCandidates(Array.from({ length: 6 }, (_, index) => ({
      source: 'Research blog', title: index === 1 ? 'AI-assisted PHP security fixes' : `AI release ${index}`,
      url: `https://example.com/release-${index}`, date: '2026-10-21', snippet: '',
      hn: [{ id: String(index), points: 1000 - index * 100, comments: 0 }],
    })));
    const groups = [6, 5, 4, 3, 2, 1].map(id => ({ candidateIds: [id], primaryCandidateId: id, eligible: true, reason: 'Relevant AI development.' }));
    // Group 5 is PHP. Group 1 is the lower-scoring sixth candidate.
    respond((replacement ? [6, 4, 3, 2, 1] : [2, 3, 4, 5, 6]).map(story), groups);
    if (replacement) {
      await expect(summarize(pool, 20, [])).rejects.toThrow(/unselected development 1/);
    } else {
      const digest = await summarize(pool, 20, []);
      expect(digest.stories.map(s => s.sourceUrl)).toEqual(pool.slice(0, 5).map(item => item.url));
      expect(digest.stories[1].sourceTitle).toBe('AI-assisted PHP security fixes');
    }
    const classifierInput = create.mock.calls[0][0].messages[1].content;
    const writerInput = create.mock.calls[1][0].messages[1].content;
    expect(classifierInput).toContain('https://example.com/release-5');
    expect(writerInput).toContain('AI-assisted PHP security fixes');
    expect(writerInput).not.toContain('https://example.com/release-5');
  });
});

describe('digest completion diagnostics', () => {
  it.each([false, true])('leaves output room after 8,000 reasoning tokens (format fallback: %s)', async fallback => {
    const withinBudget = (value: unknown) => async (request: { max_tokens: number }) => {
      if (request.max_tokens <= 8000) {
        return {
          choices: [{ finish_reason: 'length', message: { content: null } }],
          usage: { completion_tokens: 8000, completion_tokens_details: { reasoning_tokens: 8000 } },
        };
      }
      return response(value);
    };
    if (fallback) create.mockRejectedValueOnce(Object.assign(new Error('Unsupported schema'), { status: 400 }));
    create.mockImplementationOnce(withinBudget({ groups: onlyPrimary }));
    create.mockImplementationOnce(withinBudget(issue([story(2)])));

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
    respond([story(2)], onlyPrimary);
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
