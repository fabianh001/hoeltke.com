import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { THEME_BOOTSTRAP, THEME_STORAGE_KEY, initThemeToggle } from './site-theme';

let dispose: (() => void) | undefined;
const bootstrap = () => window.eval(THEME_BOOTSTRAP);
const button = () => document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!;
const icon = () => document.querySelector<HTMLLinkElement>('#site-favicon')!;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
  document.head.innerHTML = '<link id="site-favicon" rel="icon" href="/favicon.svg">';
  document.body.innerHTML = '<button type="button" data-theme-toggle role="switch" aria-label="Dark mode" aria-checked="false" hidden>Dark mode</button>';
});
afterEach(() => { dispose?.(); dispose = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

test('defaults to light even when the operating system prefers dark', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
  bootstrap();
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(icon().getAttribute('href')).toBe('/favicon.svg');
  vi.unstubAllGlobals();
});

test('restores a saved dark theme and matching favicon before controls initialize', () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'dark');
  bootstrap();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.style.colorScheme).toBe('dark');
  expect(icon().getAttribute('href')).toBe('/favicon-dark.svg');
});

test('ignores invalid saved preferences', () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'invalid');
  bootstrap();
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('still starts in light when reading storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(bootstrap).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('switches both ways with synchronized accessibility, persistence and favicon', () => {
  bootstrap(); dispose = initThemeToggle();
  expect(button().hidden).toBe(false);
  button().click();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(button().getAttribute('aria-checked')).toBe('true');
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  expect(icon().getAttribute('href')).toBe('/favicon-dark.svg');
  button().click();
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(button().getAttribute('aria-checked')).toBe('false');
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  expect(icon().getAttribute('href')).toBe('/favicon.svg');
});

test('a saved choice survives a new page initialization', () => {
  bootstrap(); dispose = initThemeToggle(); button().click(); dispose();
  document.documentElement.removeAttribute('data-theme');
  bootstrap(); dispose = initThemeToggle();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(button().getAttribute('aria-checked')).toBe('true');
});

test('switching still works when saving storage is blocked', () => {
  bootstrap(); dispose = initThemeToggle();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(() => button().click()).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('synchronizes other tabs and storage clear without reacting to unrelated keys', () => {
  bootstrap(); dispose = initThemeToggle();
  window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(button().getAttribute('aria-checked')).toBe('true');
  window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', newValue: 'light' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }));
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(button().getAttribute('aria-checked')).toBe('false');
});
