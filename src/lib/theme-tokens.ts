import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS_PATH = join(dirname(fileURLToPath(import.meta.url)), '../styles/global.css');

// Apple Mail force-inverts exact #000000/#ffffff in dark mode; one step off dodges it.
const EMAIL_SAFE: Record<string, string> = {
  '#000000': '#000001',
  '#ffffff': '#fffffe',
};

/**
 * Parse the `:root` custom-property block of global.css so emails share the
 * site's exact palette and can't drift from it. Only plain hex values are
 * returned; rgba()/color-mix() tokens are skipped (emails don't use them).
 */
export function themeTokens(cssPath = CSS_PATH): Record<string, string> {
  const css = readFileSync(cssPath, 'utf8');
  const root = css.match(/:root\s*\{([^}]*)\}/)?.[1];
  if (!root) throw new Error(`no :root block found in ${cssPath}`);
  const tokens: Record<string, string> = {};
  for (const [, name, value] of root.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    const hex = value.toLowerCase();
    tokens[name] = EMAIL_SAFE[hex] ?? hex;
  }
  return tokens;
}
