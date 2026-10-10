import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Terminal from './Terminal';

// jsdom has no layout or scrolling implementation.
HTMLElement.prototype.scrollTo = () => {};

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('Tab on an empty prompt lets keyboard users leave the terminal', () => {
  render(<Terminal issues={[]} />);
  const input = screen.getByRole('textbox', { name: 'Terminal input' });
  expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(true);
});

test('Shift-Tab lets keyboard users leave a partially typed command', () => {
  render(<Terminal issues={[]} />);
  const input = screen.getByRole('textbox', { name: 'Terminal input' });
  fireEvent.change(input, { target: { value: 'who' } });
  expect(fireEvent.keyDown(input, { key: 'Tab', shiftKey: true })).toBe(true);
});

test('Tab still completes a partially typed command', () => {
  render(<Terminal issues={[]} />);
  const input = screen.getByRole('textbox', { name: 'Terminal input' }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'who' } });
  expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false);
  expect(input.value).toBe('whoami ');
});

test('mobile follows new output by scrolling the page prompt into view', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const scrollIntoView = vi.fn();
  const scrollTo = vi.spyOn(HTMLElement.prototype, 'scrollTo');
  render(<Terminal issues={[]} />);
  const input = screen.getByRole('textbox', { name: 'Terminal input' });
  input.scrollIntoView = scrollIntoView;
  fireEvent.click(screen.getByRole('button', { name: 'help' }));
  expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  expect(scrollTo).not.toHaveBeenCalled();
  scrollTo.mockRestore();
});

test('desktop follows new output inside the terminal without scrolling the page', () => {
  const scrollIntoView = vi.fn();
  const scrollTo = vi.spyOn(HTMLElement.prototype, 'scrollTo');
  render(<Terminal issues={[]} />);
  const input = screen.getByRole('textbox', { name: 'Terminal input' });
  input.scrollIntoView = scrollIntoView;
  fireEvent.click(screen.getByRole('button', { name: 'help' }));
  expect(scrollTo).toHaveBeenCalled();
  expect(scrollIntoView).not.toHaveBeenCalled();
  scrollTo.mockRestore();
});
