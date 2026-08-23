import { renderEmailShell, MONO } from './email-shell';
import { themeTokens } from './theme-tokens';
import { renderDigestHtml } from './render-markdown';

export interface IssueEmailInput {
  title: string;
  description: string;
  body: string; // markdown
  issue: number;
  date: Date;
  tags?: string[];
  sources?: { title: string; url: string }[];
}

const DEFAULT_SITE = 'https://hoeltke.com';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
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
  const tags = input.tags ?? [];
  const sources = input.sources ?? [];

  const extraCss = `
  /* site tokens: issue/date -> h1 is mt-3 (12px); h1 -> desc is mt-3 (12px);
     desc -> divider is pb-6 (24px); divider -> content is mt-8 (32px). */
  .tag { display:inline-block; font-family:${MONO}; font-size:12px; color:${t.faint};
         border:1px solid ${t.line}; border-radius:4px; padding:2px 6px; margin:0 0 4px 12px; }
  h1.title { font-family:${MONO}; font-size:24px; line-height:1.2; letter-spacing:-0.01em; color:${t.text}; margin:12px 0 0; }
  .desc { font-size:18px; line-height:1.5; color:${t.muted}; margin:12px 0 24px; }
  .rule { border-top:1px solid ${t.line}; margin:0 0 32px; }
  .issue-content h2 { font-family:${MONO}; font-size:24px; line-height:32px; color:${t.text}; margin:48px 0 24px; }
  .issue-content h3 { font-family:${MONO}; font-size:20px; line-height:32px; color:${t.text}; margin:32px 0 12px; }
  .issue-content p { font-size:16px; line-height:1.6; color:${t.text}; margin:0 0 20px; }
  .issue-content strong { color:${t.text}; }
  .issue-content a { color:${t.accent}; text-decoration:none; }
  .issue-content ul, .issue-content ol { padding-left:26px; color:${t.text}; margin:0 0 20px; }
  .issue-content li { font-size:16px; line-height:1.6; margin:0 0 8px; }
  .sources { margin:40px 0 0; border:1px solid ${t.line}; border-radius:12px; padding:20px; background:${t.panel}; }
  .sources-label { font-family:${MONO}; font-size:12px; font-weight:600; letter-spacing:0.1em;
                    text-transform:uppercase; color:${t.faint}; margin:0; }
  .sources ul { list-style:none; padding:0; margin:12px 0 0; }
  .sources li { font-family:${MONO}; font-size:14px; line-height:1.5; color:${t.faint}; margin:0 0 6px; }
  .sources a { color:${t.accent}; text-decoration:none; }
  .unsub { font-family:${MONO}; font-size:12px; color:${t.faint}; margin-top:8px; }
  .unsub a { color:${t.faint}; text-decoration:underline; }`;

  const tagsHtml = tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  const sourcesHtml = sources.length
    ? `
  <div class="sources">
    <p class="sources-label">$ cat sources.txt</p>
    <ul>${sources
      .map((s) => `<li>→ <a href="${escapeAttr(s.url)}">${escapeHtml(s.title)}</a></li>`)
      .join('')}</ul>
  </div>`
    : '';

  const contentHtml = `
  <p class="brand"><span class="g">$</span> <b>hoeltke.com</b> ~ cat ai-weekly/${num}.md</p>
  <div class="meta"><span class="g">issue #${num}</span> &nbsp; ${dateStr}${tagsHtml}</div>
  <h1 class="title">${escapeHtml(input.title)}</h1>
  <p class="desc">${escapeHtml(input.description)}</p>
  <div class="rule"></div>
  <div class="issue-content">${content}</div>${sourcesHtml}`;

  const footerHtml = `
  <p class="signoff"><span class="g">●</span> auto-curated &amp; AI-summarized — no humans in the loop.</p>
  <p class="unsub"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">unsubscribe</a> · sent by hoeltke.com</p>`;

  return {
    subject: input.title,
    html: renderEmailShell({ preheader: escapeHtml(input.description), contentHtml, extraCss, footerHtml }),
  };
}
