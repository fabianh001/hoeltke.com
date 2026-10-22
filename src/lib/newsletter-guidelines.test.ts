import { describe, expect, it } from 'vitest';
import { checkNewsletterGuidelines } from './newsletter-guidelines';

describe('newsletter editorial guidelines', () => {
  it('counts visible Markdown text, headings, metadata, and repeated source labels, excluding link destinations', () => {
    const result = checkNewsletterGuidelines({
      title: 'Weekly news', description: 'This week',
      body: '## A model\n\n**Useful** [source label](https://example.com/path/with/many/words).\n\n![A diagram](image.png)',
      sources: [{ title: 'source label' }],
    });
    expect(result.wordCount).toBe(13);
    expect(result.storyCount).toBe(1);
    expect(result.warnings).toEqual([]);
  });

  it('accepts exactly 800 words and five stories without warnings', () => {
    const body = Array.from({ length: 5 }, () => '## Headline\n\n').join('') + 'word '.repeat(795);
    expect(checkNewsletterGuidelines({ body })).toMatchObject({
      wordCount: 800, storyCount: 5, readingMinutes: 4, warnings: [],
    });
  });

  it('returns advisory warnings for oversized manual edits without rejecting or changing the copy', () => {
    const input = { body: Array.from({ length: 6 }, () => '## Story\n\n').join('') + 'word '.repeat(900) };
    const original = input.body;
    const report = checkNewsletterGuidelines(input);
    expect(report.storyCount).toBe(6);
    expect(report.wordCount).toBe(906);
    expect(report.warnings).toHaveLength(2);
    expect(report.warnings.join(' ')).toMatch(/800/);
    expect(report.warnings.join(' ')).toMatch(/5/);
    expect(input.body).toBe(original);
  });

  it('does not count Markdown examples inside code blocks as stories', () => {
    expect(checkNewsletterGuidelines({ body: '## Actual story\n\n```md\n## Example\n```' }).storyCount).toBe(1);
  });
});
