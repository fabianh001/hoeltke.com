/** Enhance the native header form without adding a second action button. */
export function initHeaderSubscribe(root: HTMLElement): () => void {
  const form = root.querySelector<HTMLFormElement>('form')!;
  const field = root.querySelector<HTMLElement>('[data-email-field]')!;
  const email = form.querySelector<HTMLInputElement>('[name=email]')!;
  const button = form.querySelector<HTMLButtonElement>('button')!;
  const status = root.querySelector<HTMLElement>('[data-subscribe-status]')!;
  const error = root.querySelector<HTMLElement>('[data-subscribe-error]')!;
  const doc = root.ownerDocument;
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  let pending = false;
  let confirmed = false;

  const expand = () => {
    root.setAttribute('data-open', '');
    field.inert = confirmed;
    button.type = confirmed ? 'button' : 'submit';
    button.setAttribute('aria-expanded', 'true');
    if (!confirmed) email.focus({ preventScroll: true });
  };
  const collapse = (restoreFocus = false) => {
    if (pending) return;
    root.removeAttribute('data-open');
    field.inert = true;
    button.type = 'button';
    button.textContent = 'Subscribe';
    button.setAttribute('aria-expanded', 'false');
    error.hidden = true;
    if (confirmed) {
      confirmed = false;
      status.hidden = true;
      root.removeAttribute('data-confirmed');
    }
    if (restoreFocus) button.focus({ preventScroll: true });
  };

  root.setAttribute('data-enhanced', '');
  collapse();
  button.addEventListener('click', (event) => {
    if (confirmed) {
      event.preventDefault();
      collapse(true);
    } else if (!root.hasAttribute('data-open')) {
      event.preventDefault();
      expand();
    }
  }, options);
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.hasAttribute('data-open')) {
      event.preventDefault();
      collapse(true);
    }
  }, options);
  doc.addEventListener('pointerdown', (event) => {
    if (!root.contains(event.target as Node)) collapse();
  }, options);
  root.addEventListener('focusout', () => {
    queueMicrotask(() => {
      if (!listeners.signal.aborted && !root.contains(doc.activeElement)) collapse();
    });
  }, options);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending || confirmed || !form.reportValidity()) return;
    pending = true;
    error.hidden = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    email.readOnly = true;
    form.setAttribute('aria-busy', 'true');
    const data = new FormData(form);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), website: data.get('website') }),
        signal: listeners.signal,
      });
      if (!response.ok) throw new Error('Subscribe request failed');
      const hadFocus = root.contains(doc.activeElement);
      confirmed = true;
      root.setAttribute('data-confirmed', '');
      field.inert = true;
      status.textContent = 'Check your inbox to confirm.';
      status.hidden = false;
      button.type = 'button';
      button.textContent = 'Done';
      button.disabled = false;
      if (hadFocus) button.focus({ preventScroll: true });
    } catch {
      if (listeners.signal.aborted) return;
      error.textContent = 'Couldn’t subscribe. Please try again.';
      error.hidden = false;
      button.textContent = 'Subscribe';
      email.focus({ preventScroll: true });
    } finally {
      pending = false;
      email.readOnly = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  }, options);

  return () => listeners.abort();
}
