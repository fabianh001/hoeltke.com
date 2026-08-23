import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const md = new MarkdownIt({ html: false, linkify: true });

/**
 * Resolve a possibly-relative URL against `site`. Digest content is
 * AI-generated, so a single malformed link must not crash the whole feed
 * build — on failure we leave the original value untouched.
 */
function absolutize(url: string, site: string): string {
  try {
    return new URL(url, site).href;
  } catch {
    return url;
  }
}

/**
 * Render a digest issue's markdown body into sanitized HTML suitable for the
 * RSS feed and the newsletter email. Relative href/src are made
 * absolute against `site` so links work in inboxes and feed readers.
 */
export function renderDigestHtml(markdown: string, site: string): string {
  const rendered = md.render(markdown);
  return sanitizeHtml(rendered, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'p', 'a', 'ul', 'ol', 'li', 'blockquote',
      'strong', 'em', 'code', 'pre', 'hr', 'br', 'img',
    ],
    allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.href) attribs.href = absolutize(attribs.href, site);
        return { tagName, attribs };
      },
      img: (tagName, attribs) => {
        if (attribs.src) attribs.src = absolutize(attribs.src, site);
        return { tagName, attribs };
      },
    },
  });
}
