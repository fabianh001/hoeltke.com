import { renderEmailShell, MONO } from './email-shell';
import { themeTokens } from './theme-tokens';

/**
 * Double-opt-in confirmation email. {{confirm_url}} is substituted by the
 * subscribe service at request time (the HTML itself is prebuilt in CI so the
 * zero-dependency server never imports TS).
 */
export function buildConfirmEmail(): { subject: string; html: string } {
  const t = themeTokens();

  const extraCss = `
  .lead { font-size:16px; line-height:1.6; color:${t.text}; margin:16px 0 24px; }
  .btn { display:inline-block; background:${t.green}; color:${t.bg}; font-family:${MONO};
         font-size:15px; font-weight:600; text-decoration:none; padding:12px 20px; border-radius:8px; }
  .note { font-family:${MONO}; font-size:12px; color:${t.faint}; margin-top:24px; }`;

  const contentHtml = `
  <p class="brand"><span class="g">$</span> <b>hoeltke.com</b> ~ ./confirm-subscription</p>
  <p class="lead">one click and you're on the list — AI Weekly, one issue every Friday.
  no spam, unsubscribe anytime.</p>
  <a class="btn" href="{{confirm_url}}">confirm subscription →</a>
  <p class="note">link expires in 48 h. didn't request this? just ignore it.</p>`;

  return {
    subject: 'confirm your subscription — AI Weekly',
    html: renderEmailShell({
      preheader: 'one click and AI Weekly lands in your inbox every Friday.',
      contentHtml,
      extraCss,
    }),
  };
}
