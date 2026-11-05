import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderEmailShell, SANS, MONO, EMAIL_THEME } from './email-shell';
import { renderDigestHtml } from './render-markdown';

export interface IssueEmailInput {
  title: string;
  description: string;
  body: string; // markdown
  issue: number;
  date: Date;
  slug?: string;
  audio?: string;
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
 * Build the weekly issue as a complete email document. The
 * {{{RESEND_UNSUBSCRIBE_URL}}} placeholder is substituted per-recipient by
 * Resend at broadcast time. Pure → unit-testable.
 */
export function buildIssueEmail(
  input: IssueEmailInput,
  site = DEFAULT_SITE
): { subject: string; html: string } {
  const t = EMAIL_THEME;
  const num = String(input.issue).padStart(2, '0');
  const dateStr = input.date.toISOString().slice(0, 10);
  const content = renderDigestHtml(input.body, site);
  const tags = input.tags ?? [];
  const sources = input.sources ?? [];

  const extraCss = `
  .tag { display:inline-block; font-family:${SANS}; font-size:12px; line-height:1.5; color:${t.muted};
         border:1px solid ${t.line}; border-radius:4px; padding:2px 6px; margin:0 0 4px 8px; }
  h1.title { font-family:${SANS}; font-size:34px; font-weight:600; line-height:1.2; letter-spacing:-0.025em; color:${t.text}; margin:16px 0 0; }
  .desc { font-size:19px; line-height:1.6; color:${t.muted}; margin:20px 0 28px; }
  .rule { border-top:1px solid ${t.line}; margin:0 0 32px; }
  .issue-content h1, .issue-content h2 { font-family:${SANS}; font-size:26px; font-weight:600; line-height:1.3; letter-spacing:-0.018em; color:${t.text}; margin:40px 0 18px; }
  .issue-content > :first-child { margin-top:0; }
  .issue-content h3, .issue-content h4 { font-family:${SANS}; font-size:22px; font-weight:600; line-height:1.4; color:${t.text}; margin:32px 0 14px; }
  .issue-content p { font-size:17px; line-height:1.7; color:${t.text}; margin:0 0 20px; }
  .issue-content strong { color:${t.text}; font-weight:600; }
  .issue-content a { color:${t.accent}; text-decoration:underline; text-underline-offset:3px; }
  .issue-content ul, .issue-content ol { padding-left:24px; color:${t.text}; margin:0 0 20px; }
  .issue-content li { font-size:17px; line-height:1.7; margin:0 0 8px; }
  .issue-content img { max-width:100%; height:auto; }
  .issue-content blockquote { margin:24px 0; padding:18px 20px; background:${t.panel}; color:${t.muted}; }
  .issue-content code { font-family:${MONO}; font-size:14px; }
  .issue-content pre { white-space:pre-wrap; word-break:break-all; padding:20px; background:${t.panel}; }
  .issue-content hr { border:0; border-top:1px solid ${t.line}; margin:32px 0; }
  .sources { margin:40px 0 0; border-top:1px solid ${t.line}; padding:24px 0 0; }
  .sources-label { font-family:${SANS}; font-size:22px; font-weight:600; line-height:1.4; color:${t.text}; margin:0; }
  .sources ul { list-style:none; padding:0; margin:16px 0 0; }
  .sources li { font-family:${SANS}; font-size:14px; line-height:1.65; color:${t.muted}; margin:0 0 10px; }
  .sources a { color:${t.accent}; text-decoration:underline; text-underline-offset:3px; }
  .unsub { font-family:${SANS}; font-size:12px; line-height:1.6; color:${t.faint}; margin-top:12px; }
  .unsub a { color:${t.faint}; text-decoration:underline; }`;

  const tagsHtml = tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  const sourcesHtml = sources.length
    ? `
  <div class="sources">
    <h2 class="sources-label">Sources</h2>
    <ul>${sources
      .map((s) => `<li><a href="${escapeAttr(s.url)}">${escapeHtml(s.title)}</a></li>`)
      .join('')}</ul>
  </div>`
    : '';

  let audioUrl = input.audio;
  const slug = input.slug ?? (input.issue ? `2026-${String(input.issue).padStart(2, '0')}` : '');
  const webUrl = slug ? `${site.replace(/\/$/, '')}/digest/${slug}` : site;

  if (!audioUrl && slug) {
    const localMp3 = join(process.cwd(), 'public/audio/digest', `${slug}.mp3`);
    if (existsSync(localMp3)) {
      audioUrl = `${site.replace(/\/$/, '')}/audio/digest/${slug}.mp3`;
    }
  } else if (audioUrl && !/^https?:\/\//i.test(audioUrl)) {
    const cleanPath = audioUrl.replace(/^\/+/, '');
    audioUrl = `${site.replace(/\/$/, '')}/${cleanPath}`;
  }

  const audioHtml = audioUrl
    ? `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
    <tr>
      <td align="center" style="border-radius:6px; background:${t.accent};">
        <a href="${escapeAttr(webUrl)}" target="_blank" class="play-btn" style="font-family:${SANS}; font-size:14px; line-height:22px; font-weight:600; color:${t.bg}; text-decoration:none; padding:11px 20px; display:inline-block; border-radius:6px;">&#9654; Listen</a>
      </td>
    </tr>
  </table>`
    : '';

  const contentHtml = `
  <p class="brand"><a href="${escapeAttr(site)}"><img src="${escapeAttr(site.replace(/\/$/, ''))}/logo-email.png" width="24" height="24" alt="">hoeltke.com</a></p>
  <div class="meta"><span>issue #${num}</span> &nbsp; ${dateStr}${tagsHtml}</div>
  <h1 class="title">${escapeHtml(input.title)}</h1>
  <p class="desc">${escapeHtml(input.description)}</p>
  ${audioHtml}
  <div class="rule"></div>
  <div class="issue-content">${content}</div>${sourcesHtml}`;

  const footerHtml = `
  <p class="signoff">The week’s top AI stories in a quick read. Catch up in one place, every Friday.</p>
  <p class="unsub"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">unsubscribe</a> · sent by hoeltke.com</p>`;

  return {
    subject: input.title,
    html: renderEmailShell({ preheader: escapeHtml(input.description), contentHtml, extraCss, footerHtml }),
  };
}
