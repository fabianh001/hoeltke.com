/** Native route shortcuts and a bounded label scramble; no client router needed. */
export function initSiteNavigation(
  nav: HTMLElement,
  navigate: (href: string) => void = (href) => window.location.assign(href)
) {
  const tabs = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[data-shortcut]')).map((link) => {
    const label = link.querySelector<HTMLElement>('.tab-label');
    return { link, label, text: label?.textContent ?? '', frame: 0 };
  });

  const restore = (tab: (typeof tabs)[number]) => {
    cancelAnimationFrame(tab.frame);
    tab.frame = 0;
    if (tab.label) tab.label.textContent = tab.text;
  };

  const scramble = (tab: (typeof tabs)[number]) => {
    restore(tab);
    if (!tab.label || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = performance.now();
    const glyphs = '#[]/:;=+*_';
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 420);
      const resolved = Math.floor(progress * tab.text.length);
      tab.label!.textContent = Array.from(tab.text, (letter, index) =>
        index < resolved || letter === ' ' ? letter : glyphs[Math.floor(Math.random() * glyphs.length)]
      ).join('');
      if (progress < 1) tab.frame = requestAnimationFrame(tick);
      else restore(tab);
    };
    tab.frame = requestAnimationFrame(tick);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : document.activeElement;
    if (event.key === 'Escape' && target?.matches('[data-terminal-input]')) {
      event.preventDefault();
      tabs.find(({ link }) => link.dataset.shortcut === 't')?.link.focus({ preventScroll: true });
      return;
    }
    if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]')) return;
    const tab = tabs.find(({ link }) => link.dataset.shortcut === event.key.toLowerCase());
    if (!tab) return;
    event.preventDefault();
    const href = tab.link.getAttribute('href');
    if (href) navigate(href);
  };

  const cleanups = tabs.map((tab) => {
    const animate = () => scramble(tab);
    const reset = () => restore(tab);
    tab.link.addEventListener('mouseenter', animate);
    tab.link.addEventListener('focus', animate);
    tab.link.addEventListener('mouseleave', reset);
    tab.link.addEventListener('blur', reset);
    return () => {
      reset();
      tab.link.removeEventListener('mouseenter', animate);
      tab.link.removeEventListener('focus', animate);
      tab.link.removeEventListener('mouseleave', reset);
      tab.link.removeEventListener('blur', reset);
    };
  });
  document.addEventListener('keydown', onKeyDown);
  return () => {
    document.removeEventListener('keydown', onKeyDown);
    cleanups.forEach((cleanup) => cleanup());
  };
}
