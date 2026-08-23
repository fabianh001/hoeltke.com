import juice from 'juice';
import { themeTokens } from './theme-tokens';

export interface ShellInput {
  /** hidden inbox-preview line */
  preheader: string;
  /** sanitized HTML placed inside the card */
  contentHtml: string;
  /** additional CSS rules for the content (inlined by juice) */
  extraCss?: string;
  /** dark-styled footer line(s) appended inside the card */
  footerHtml?: string;
}

const SITE = 'https://hoeltke.com';

/** Email font stacks: self-hosted variable fonts load in Apple Mail; the rest fall back. */
export const MONO = `'JetBrains Mono','SF Mono',Consolas,monospace`;
export const SANS = `'Inter',-apple-system,'Segoe UI',sans-serif`;

/**
 * Wrap card content in the full dark email document (spec: dark-always).
 * We own the whole document — no provider wrapper exists. Styles are inlined
 * with juice because many clients strip <style>; juice keeps @font-face in a
 * retained <style> block for the clients that do load web fonts.
 */
export function renderEmailShell({ preheader, contentHtml, extraCss = '', footerHtml = '' }: ShellInput): string {
  const t = themeTokens();
  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<style>
  @font-face {
    font-family: 'JetBrains Mono';
    src: url('${SITE}/fonts/jetbrains-mono-latin-wght-normal.woff2') format('woff2');
    font-weight: 100 800; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'Inter';
    src: url('${SITE}/fonts/inter-latin-wght-normal.woff2') format('woff2');
    font-weight: 100 900; font-style: normal; font-display: swap;
  }
  html, body { margin:0; padding:0; width:100%; height:100%; background:${t.bg}; }
  .preheader { display:none; max-height:0; overflow:hidden; }
  /* On a table cell CSS height is a MINIMUM (content still grows it), so this
     floors the black band instead of capping it. Clients that strip vh units
     (Gmail web/Android) fall back to the px value declared just before. */
  .wrap { background:${t.bg}; padding:24px 12px; font-family:${SANS}; height:800px; height:100vh; }
  .card { text-align:left; background:${t['term-bg']}; border:1px solid ${t.line}; border-radius:12px; padding:28px; font-family:${SANS}; }
  .brand { font-family:${MONO}; font-size:14px; color:${t.faint}; margin:0 0 18px 0; }
  .brand b { color:${t.text}; }
  .g { color:${t.green}; }
  .meta { font-family:${MONO}; font-size:12px; color:${t.faint}; }
  .rule { border-top:1px solid ${t.line}; margin:20px 0; }
  .signoff { font-family:${MONO}; font-size:12px; color:${t.faint}; margin-top:24px; }
  ${extraCss}
</style>
</head>
<body bgcolor="${t.bg}">
  <div class="preheader">${preheader}</div>
  <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.bg}" style="width:100%;height:100%;">
    <tr>
      <td class="wrap" height="800" align="center" valign="top" bgcolor="${t.bg}">
        <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">
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
