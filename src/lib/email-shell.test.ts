import { expect, test } from 'vitest';
import { renderEmailShell } from './email-shell';

const base = { preheader: 'six stories that mattered', contentHtml: '<p class="x">hi</p>' };

test('emits a complete light document with color-scheme metas', () => {
  const html = renderEmailShell(base);
  expect(html).toMatch(/^<!doctype html>/i);
  expect(html).toContain('name="color-scheme" content="light"');
  expect(html).toContain('name="supported-color-schemes" content="light"');
  expect(html).toContain('bgcolor="#fffffe"'); // email-safe near-white, edge to edge
});

test('floors the page background in px so no client background shows below the card', () => {
  const html = renderEmailShell(base);
  const wrap = html.match(/<td class="wrap"[^>]*>/)![0];
  expect(wrap).toContain('height: 1200px');
  expect(wrap).toContain('height="1200"'); // juice mirrors it onto the attribute for Outlook
  // Never vh: the message renders in a content-sized container, so 100vh
  // resolves to the content height (or 0 in Apple Mail iOS) and, being the
  // later declaration, would silently override the px floor.
  expect(html).not.toContain('vh');
  // pane-height tiers, kept in a retained <style> block by juice
  expect(html).toMatch(/@media only screen and \(max-width:600px\)/);
  expect(html).toMatch(/@media only screen and \(min-height:900px\)/);
});

test('keeps @font-face pointing at stable /fonts/ URLs after juice inlining', () => {
  const html = renderEmailShell(base);
  expect(html).toContain('https://hoeltke.com/fonts/jetbrains-mono-latin-wght-normal.woff2');
  expect(html).toContain('https://hoeltke.com/fonts/openai-sans/OpenAISans-Regular.woff2');
  expect(html).toContain('@font-face'); // preserved in a retained <style>
});

test('inlines extraCss onto content and renders preheader + footer', () => {
  const html = renderEmailShell({
    ...base,
    extraCss: '.x { color: #123456; }',
    footerHtml: '<p class="signoff">bye</p>',
  });
  expect(html).toMatch(/<p[^>]+#123456/);
  expect(html).toContain('six stories that mattered');
  expect(html).toContain('bye');
});

// The terminal is deliberately black even when the publication is light.
test('keeps email cards light independently of the black terminal surface', () => {
  const card = renderEmailShell(base).match(/<td class="card"[^>]*>/)![0];
  expect(card).toContain('background: #fffffe');
  expect(card).not.toContain('#050507');
});
