import MarkdownIt from 'markdown-it';

export const NEWSLETTER_MAX_STORIES = 5;
export const NEWSLETTER_MAX_WORDS = 800;
export const NEWSLETTER_WORDS_PER_MINUTE = 200;

interface NewsletterCopy {
  title?: string;
  description?: string;
  body: string;
  sources?: { title: string }[];
}

const md = new MarkdownIt({ html: false });
const countWords = (value: string) => value.trim() ? value.trim().split(/\s+/u).length : 0;

/** Advisory only: never reject, truncate, or mutate manually edited issues. */
export function checkNewsletterGuidelines(copy: NewsletterCopy) {
  const tokens = md.parse(copy.body, {});
  const inlineText = (children: typeof tokens): string => children.map(token => {
    if (token.children) return inlineText(token.children);
    if (['text', 'code_inline'].includes(token.type)) return token.content;
    if (['softbreak', 'hardbreak'].includes(token.type)) return '\n';
    return '';
  }).join('');
  const bodyText = tokens.map(token => {
    if (token.type === 'inline') return inlineText(token.children ?? []);
    if (['fence', 'code_block'].includes(token.type)) return token.content;
    return '';
  }).join('\n');
  const wordCount = countWords([
    copy.title ?? '', copy.description ?? '', bodyText,
    ...(copy.sources ?? []).map(source => source.title),
  ].join('\n'));
  const storyCount = tokens.filter(token => token.type === 'heading_open' && token.tag === 'h2').length;
  const readingMinutes = wordCount / NEWSLETTER_WORDS_PER_MINUTE;
  const warnings: string[] = [];
  if (wordCount > NEWSLETTER_MAX_WORDS) {
    warnings.push(`${wordCount} words (~${readingMinutes.toFixed(1)} min) exceeds the ${NEWSLETTER_MAX_WORDS}-word / 4-minute guideline.`);
  }
  if (storyCount > NEWSLETTER_MAX_STORIES) {
    warnings.push(`${storyCount} stories exceeds the ${NEWSLETTER_MAX_STORIES}-story guideline.`);
  }
  return { wordCount, storyCount, readingMinutes, warnings };
}

export function logNewsletterGuidelines(copy: NewsletterCopy): void {
  const report = checkNewsletterGuidelines(copy);
  console.log(`Editorial check: ${report.wordCount} words (~${report.readingMinutes.toFixed(1)} min at ${NEWSLETTER_WORDS_PER_MINUTE} wpm), ${report.storyCount} stories.`);
  for (const warning of report.warnings) console.warn(`⚠ ${warning} Advisory only; continuing with this copy.`);
}
