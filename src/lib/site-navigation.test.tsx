import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { initSiteNavigation } from './site-navigation';

let cleanup: () => void;
let navigate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  document.body.innerHTML = `
    <nav class="site-tabs">
      <a href="/" data-shortcut="h" aria-label="Home"><span class="tab-label">Home</span></a>
      <a href="/terminal/" data-shortcut="t" aria-label="Terminal"><span class="tab-label">Terminal</span></a>
    </nav>
    <input aria-label="Terminal input" data-terminal-input>
    <input type="email"><textarea></textarea><select><option>Home</option></select>
    <div contenteditable="true"><span>Editable text</span></div>`;
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  navigate = vi.fn();
  cleanup = initSiteNavigation(document.querySelector('nav')!, navigate);
});

afterEach(() => {
  cleanup?.();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

const key = (value: string, options: KeyboardEventInit = {}, target: EventTarget = document) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options }));

test('H and T navigate to the matching routes, ignoring letter case', () => {
  key('h'); key('T');
  expect(navigate.mock.calls.map(([url]) => new URL(url, 'https://hoeltke.com').pathname)).toEqual(['/', '/terminal/']);
});

test('shortcuts preserve terminal, form and contenteditable typing', () => {
  for (const selector of ['input[data-terminal-input]', 'input[type=email]', 'textarea', 'select', '[contenteditable] span']) {
    key('h', {}, document.querySelector(selector)!);
    key('t', {}, document.querySelector(selector)!);
  }
  expect(navigate).not.toHaveBeenCalled();
});

test('browser modifiers, repeated keys and composition do not navigate', () => {
  for (const options of [{ctrlKey:true}, {metaKey:true}, {altKey:true}, {repeat:true}, {isComposing:true}]) key('t', options);
  const handled = new KeyboardEvent('keydown', {key:'h',bubbles:true,cancelable:true});
  handled.preventDefault();
  document.dispatchEvent(handled);
  expect(navigate).not.toHaveBeenCalled();
});

test('Escape leaves the terminal prompt so H and T become available', () => {
  const input = document.querySelector<HTMLInputElement>('[data-terminal-input]')!;
  input.focus();
  key('Escape', {}, input);
  expect(document.activeElement).toBe(document.querySelector('[data-shortcut="t"]'));
  key('h', {}, document.activeElement!);
  expect(navigate).toHaveBeenCalledTimes(1);
});

test('label scramble settles without changing the accessible link name', () => {
  vi.useFakeTimers({toFake:['requestAnimationFrame','cancelAnimationFrame','performance']});
  const link = document.querySelector<HTMLAnchorElement>('[data-shortcut="t"]')!;
  const label = link.querySelector('.tab-label')!;
  link.dispatchEvent(new MouseEvent('mouseenter'));
  vi.advanceTimersByTime(32);
  expect(label.textContent).not.toBe('Terminal');
  expect(link.getAttribute('aria-label')).toBe('Terminal');
  vi.advanceTimersByTime(450);
  expect(label.textContent).toBe('Terminal');
});

test('leaving the link cancels the scramble and restores its label', () => {
  vi.useFakeTimers({toFake:['requestAnimationFrame','cancelAnimationFrame','performance']});
  const link = document.querySelector<HTMLAnchorElement>('[data-shortcut="h"]')!;
  link.dispatchEvent(new MouseEvent('mouseenter'));
  vi.advanceTimersByTime(32);
  link.dispatchEvent(new MouseEvent('mouseleave'));
  expect(link.querySelector('.tab-label')!.textContent).toBe('Home');
  expect(vi.getTimerCount()).toBe(0);
});

test('reduced motion preserves labels instead of scrambling', () => {
  vi.stubGlobal('matchMedia', () => ({matches:true}));
  const link = document.querySelector<HTMLAnchorElement>('[data-shortcut="h"]')!;
  link.dispatchEvent(new MouseEvent('mouseenter'));
  expect(link.querySelector('.tab-label')!.textContent).toBe('Home');
});
