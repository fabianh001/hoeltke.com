/** Native route shortcuts; header labels remain static. */
export function initSiteNavigation(
  nav: HTMLElement,
  navigate: (href: string) => void = (href) => window.location.assign(href)
) {
  const tabs = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[data-shortcut]'));

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : document.activeElement;
    if (event.key === 'Escape' && target?.matches('[data-terminal-input]')) {
      event.preventDefault();
      tabs.find((link) => link.dataset.shortcut === 't')?.focus({ preventScroll: true });
      return;
    }
    if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]')) return;
    const tab = tabs.find((link) => link.dataset.shortcut === event.key.toLowerCase());
    if (!tab) return;
    event.preventDefault();
    const href = tab.getAttribute('href');
    if (href) navigate(href);
  };

  document.addEventListener('keydown', onKeyDown);
  return () => {
    document.removeEventListener('keydown', onKeyDown);
  };
}
