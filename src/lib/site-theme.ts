export const THEME_STORAGE_KEY = 'hoeltke-theme';
type Theme = 'light' | 'dark';
const FAVICONS: Record<Theme, string> = { light: '/favicon.svg', dark: '/favicon-dark.svg' };

// Runs in the head, before the page paints. White is the deliberate default,
// independently of the operating-system preference; only a saved choice wins.
export const THEME_BOOTSTRAP = `(() => {
  let theme = 'light';
  try { if (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === 'dark') theme = 'dark'; } catch {}
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const icon = document.getElementById('site-favicon');
  if (icon) icon.setAttribute('href', theme === 'dark' ? ${JSON.stringify(FAVICONS.dark)} : ${JSON.stringify(FAVICONS.light)});
})();`;

export function initThemeToggle(doc: Document = document): () => void {
  const button = doc.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button) return () => {};

  const apply = (value: unknown) => {
    const theme: Theme = value === 'dark' ? 'dark' : 'light';
    doc.documentElement.dataset.theme = theme;
    doc.documentElement.style.colorScheme = theme;
    doc.querySelector<HTMLLinkElement>('#site-favicon')?.setAttribute('href', FAVICONS[theme]);
    button.setAttribute('aria-checked', String(theme === 'dark'));
    button.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  };
  const toggle = () => {
    apply(doc.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    try { doc.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, doc.documentElement.dataset.theme!); } catch {}
  };
  const sync = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) apply(event.newValue);
  };

  apply(doc.documentElement.dataset.theme);
  button.hidden = false;
  button.addEventListener('click', toggle);
  doc.defaultView?.addEventListener('storage', sync);
  return () => {
    button.removeEventListener('click', toggle);
    doc.defaultView?.removeEventListener('storage', sync);
  };
}
