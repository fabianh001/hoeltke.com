import { renderEmailShell, MONO } from './email-shell';
import { themeTokens } from './theme-tokens';
import { renderDigestHtml } from './render-markdown';

export interface IssueEmailInput {
  title: string;
  description: string;
  body: string; // markdown
  issue: number;
  date: Date;
}

const DEFAULT_SITE = 'https://hoeltke.com';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Build the weekly issue as a complete dark email document. The
 * {{{RESEND_UNSUBSCRIBE_URL}}} placeholder is substituted per-recipient by
 * Resend at broadcast time. Pure → unit-testable.
 */
export function buildIssueEmail(
  input: IssueEmailInput,
  site = DEFAULT_SITE
): { subject: string; html: string } {
  const t = themeTokens();
  const num = String(input.issue).padStart(2, '0');
  const dateStr = input.date.toISOString().slice(0, 10);
  const content = renderDigestHtml(input.body, site);

  const extraCss = `
  h1.title { font-family:${MONO}; font-size:24px; line-height:1.2; color:${t.text}; margin:12px 0 8px; }
  .desc { font-size:16px; line-height:1.5; color:${t.muted}; margin:0 0 20px; }
  .issue-content h2 { font-family:${MONO}; font-size:18px; color:${t.text}; margin:24px 0 8px; }
  .issue-content h3 { font-family:${MONO}; font-size:16px; color:${t.text}; margin:20px 0 8px; }
  .issue-content p { font-size:15px; line-height:1.6; color:${t.text}; margin:0 0 12px; }
  .issue-content strong { color:${t.text}; }
  .issue-content a { color:${t.accent}; text-decoration:none; }
  .issue-content ul, .issue-content ol { padding-left:20px; color:${t.text}; margin:0 0 12px; }
  .issue-content li { font-size:15px; line-height:1.6; margin:4px 0; }
  .unsub { font-family:${MONO}; font-size:12px; color:${t.faint}; margin-top:8px; }
  .unsub a { color:${t.faint}; text-decoration:underline; }`;

  const contentHtml = `
  <p class="brand"><span class="g">$</span> <b>hoeltke.com</b> ~ cat ai-weekly/${num}.md</p>
  <div class="meta"><span class="g">issue #${num}</span> &nbsp; ${dateStr}</div>
  <h1 class="title">${escapeHtml(input.title)}</h1>
  <p class="desc">${escapeHtml(input.description)}</p>
  <div class="rule"></div>
  <div class="issue-content">${content}</div>`;

  const footerHtml = `
  <p class="signoff"><span class="g">●</span> auto-curated &amp; AI-summarized — no humans in the loop.</p>
  <p class="unsub"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">unsubscribe</a> · sent by hoeltke.com</p>`;

  return {
    subject: input.title,
    html: renderEmailShell({ preheader: escapeHtml(input.description), contentHtml, extraCss, footerHtml }),
  };
}
