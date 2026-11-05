import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/dom';
import { initHeaderSubscribe } from './header-subscribe';

let root: HTMLElement;
let input: HTMLInputElement;
let button: HTMLButtonElement;
let form: HTMLFormElement;
let cleanup: () => void;
let send: ReturnType<typeof vi.fn>;

beforeEach(() => {
  document.body.innerHTML = `<header><a class="site-brand" href="/">Home</a>
    <div class="header-signup"><form action="/api/subscribe" method="post">
      <div data-email-field><input type="email" name="email" required aria-label="Email address"></div>
      <input name="website" type="text" hidden><button type="submit">Subscribe</button>
    </form><p data-subscribe-status role="status" hidden></p><p data-subscribe-error role="alert" hidden></p></div>
    <a href="/terminal/" id="outside">Terminal</a></header>`;
  root = document.querySelector('.header-signup')!;
  input = root.querySelector('input')!;
  button = root.querySelector('button')!;
  form = root.querySelector('form')!;
  send = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', send);
  cleanup = initHeaderSubscribe(root);
});

afterEach(() => { cleanup?.(); vi.unstubAllGlobals(); document.body.innerHTML = ''; });

const open = () => fireEvent.click(button);
const submit = () => { input.value = 'fabian@example.com'; fireEvent.submit(form); };

test('the first click reveals and focuses email without sending a request', () => {
  expect(button.type).toBe('button');
  expect(root.querySelector<HTMLElement>('[data-email-field]')!.inert).toBe(true);
  open();
  expect(document.activeElement).toBe(input);
  expect(button.type).toBe('submit');
  expect(button.getAttribute('aria-expanded')).toBe('true');
  expect(root.querySelectorAll('button')).toHaveLength(1);
  expect(send).not.toHaveBeenCalled();
});

test('Escape collapses, restores focus and keeps an unfinished address', () => {
  open(); input.value = 'unfinished@';
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(button);
  open(); expect(input.value).toBe('unfinished@');
});

test('outside clicks and keyboard focus leaving the form dismiss it without stealing focus', async () => {
  open(); fireEvent.pointerDown(document.body);
  expect(button.getAttribute('aria-expanded')).toBe('false');
  open(); const outside = document.querySelector<HTMLElement>('#outside')!; outside.focus();
  await waitFor(() => expect(button.getAttribute('aria-expanded')).toBe('false'));
  expect(document.activeElement).toBe(outside);
});

test('invalid email never reaches the API', () => {
  open(); input.value = 'invalid'; fireEvent.submit(form);
  expect(send).not.toHaveBeenCalled();
  expect(button.disabled).toBe(false);
});

test('a pending request prevents duplicates and a successful response announces confirmation', async () => {
  let resolve!: (value: { ok: boolean }) => void;
  send.mockReturnValue(new Promise(r => { resolve = r; }));
  open(); submit(); fireEvent.submit(form);
  expect(button.disabled).toBe(true);
  expect(form.getAttribute('aria-busy')).toBe('true');
  expect(send).toHaveBeenCalledTimes(1);
  expect(JSON.parse(send.mock.calls[0][1].body)).toEqual({email:'fabian@example.com',website:''});
  resolve({ok:true});
  await waitFor(() => expect(root.querySelector('[role=status]')!.textContent).toContain('Check your inbox'));
  expect(root.querySelector<HTMLElement>('[role=status]')!.hidden).toBe(false);
  expect(button.disabled).toBe(false);
  expect(document.activeElement).toBe(button);
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('false');
});

test.each(['http', 'network'])('a %s failure preserves the email and allows retry without claiming success', async kind => {
  if(kind === 'http') send.mockResolvedValueOnce({ok:false});
  else send.mockRejectedValueOnce(new TypeError('offline'));
  open(); submit();
  await waitFor(() => expect(root.querySelector<HTMLElement>('[role=alert]')!.hidden).toBe(false));
  expect(root.querySelector<HTMLElement>('[role=status]')!.hidden).toBe(true);
  expect(input.value).toBe('fabian@example.com');
  expect(button.disabled).toBe(false);
  expect(document.activeElement).toBe(input);
  fireEvent.submit(form);
  await waitFor(() => expect(root.querySelector<HTMLElement>('[role=status]')!.hidden).toBe(false));
});
