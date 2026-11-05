import juice from 'juice';

export interface ShellInput {
  /** hidden inbox-preview line */
  preheader: string;
  /** sanitized HTML placed inside the card */
  contentHtml: string;
  /** additional CSS rules for the content (inlined by juice) */
  extraCss?: string;
  /** footer line(s) appended inside the card */
  footerHtml?: string;
}

const SITE = 'https://hoeltke.com';

/** Self-hosted publication fonts for supporting clients; system fallbacks elsewhere. */
export const MONO = `'JetBrains Mono','SF Mono',Consolas,monospace`;
export const SANS = `'OpenAI Sans',-apple-system,'Helvetica Neue',Arial,sans-serif`;

/** Monochrome publication palette, scoped to email.
 * Near-white preserves the existing email-safe treatment of pure white. */
export const EMAIL_THEME = {
  bg: '#fffffe',
  panel: '#f7f7f7',
  line: '#e5e5e5',
  text: '#181818',
  muted: '#5d5d5d',
  faint: '#666666',
  accent: '#181818',
} as const;

/**
 * Wrap card content in a complete email document using the white publication design.
 * We own the whole document — no provider wrapper exists. Styles are inlined
 * with juice because many clients strip <style>; juice keeps @font-face in a
 * retained <style> block for the clients that do load web fonts.
 */
export function renderEmailShell({ preheader, contentHtml, extraCss = '', footerHtml = '' }: ShellInput): string {
  const t = EMAIL_THEME;
  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
  @font-face {
    font-family: 'OpenAI Sans';
    src: url('${SITE}/fonts/openai-sans/OpenAISans-Regular.woff2') format('woff2');
    font-weight: 400; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'OpenAI Sans';
    src: url('${SITE}/fonts/openai-sans/OpenAISans-Semibold.woff2') format('woff2');
    font-weight: 600; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'OpenAI Sans';
    src: url('${SITE}/fonts/openai-sans/OpenAISans-Bold.woff2') format('woff2');
    font-weight: 700; font-style: normal; font-display: swap;
  }
  html, body { margin:0; padding:0; width:100%; height:100%; background:${t.bg}; }
  .preheader { display:none; max-height:0; overflow:hidden; }
  /* On a table cell CSS height is a MINIMUM (content still grows it), so this
     floors the background band instead of capping it. Deliberately px, never vh:
     clients render the message in a content-sized container, so 100vh resolves
     to the content height (or 0 in Apple Mail iOS) and floors nothing. Media
     queries on the pane height step the floor up when there is room for it. */
  .wrap { background:${t.bg}; padding:24px 12px; font-family:${SANS}; height:1200px; }
  @media only screen and (max-width:600px) { td.wrap { height:800px !important; } }
  @media only screen and (min-height:900px) { td.wrap { height:1600px !important; } }
  .card { text-align:left; background:${t.bg}; padding:28px; font-family:${SANS}; color:${t.text}; overflow-wrap:break-word; word-break:break-word; }
  .brand { font-family:${SANS}; font-size:20px; font-weight:600; letter-spacing:-0.025em; color:${t.text}; margin:0 0 32px; }
  .brand a { color:${t.text}; text-decoration:none; }
  .brand img { vertical-align:middle; margin-right:10px; border:0; }
  .meta { font-family:${SANS}; font-size:13px; line-height:1.6; color:${t.muted}; }
  .rule { border-top:1px solid ${t.line}; margin:20px 0; }
  .signoff { font-family:${SANS}; font-size:13px; line-height:1.6; color:${t.muted}; border-top:1px solid ${t.line}; padding-top:24px; margin:32px 0 0; }
  a:focus-visible { outline:2px solid ${t.accent}; outline-offset:4px; }
  @media only screen and (max-width:600px) {
    td.card { padding:20px 12px !important; }
    h1.title { font-size:28px !important; }
  }
  ${extraCss}
</style>
</head>
<body bgcolor="${t.bg}">
  <div class="preheader">${preheader}</div>
  <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.bg}" style="width:100%;height:100%;">
    <tr>
      <td class="wrap" align="center" valign="top" bgcolor="${t.bg}">
        <table role="presentation" width="640" align="center" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;margin:0 auto;">
          <tr>
            <td class="card" align="left">${contentHtml}${footerHtml}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return juice(doc);
}
