import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { TerminalSubscribe } from './TerminalSubscribe';

const fetchMock = vi.fn().mockResolvedValue({ ok: true });
beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

test('shows confirmation and POSTs to /api/subscribe on a valid email', () => {
  render(<TerminalSubscribe />);
  const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'fabian@hoeltke.com' } });
  fireEvent.submit(input.closest('form')!);
  expect(screen.getByText(/check your inbox/i)).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/subscribe',
    expect.objectContaining({ method: 'POST' })
  );
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).email).toBe('fabian@hoeltke.com');
});

test('rejects an invalid email, keeps the input, no request', () => {
  render(<TerminalSubscribe />);
  const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'nope' } });
  fireEvent.submit(input.closest('form')!);
  expect(screen.queryByText(/check your inbox/i)).toBeNull();
  expect(screen.getByText(/that doesn't look like an email/i)).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('calls onDone after completion so focus can return to the terminal', () => {
  const onDone = vi.fn();
  render(<TerminalSubscribe onDone={onDone} />);
  const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'fabian@hoeltke.com' } });
  fireEvent.submit(input.closest('form')!);
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('does not call onDone when the email is invalid', () => {
  const onDone = vi.fn();
  render(<TerminalSubscribe onDone={onDone} />);
  const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'nope' } });
  fireEvent.submit(input.closest('form')!);
  expect(onDone).not.toHaveBeenCalled();
});

test('an empty submit is a no-op (no error shown, no request)', () => {
  render(<TerminalSubscribe />);
  const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
  fireEvent.submit(input.closest('form')!);
  expect(screen.queryByText(/that doesn't look like an email/i)).toBeNull();
  expect(screen.queryByText(/check your inbox/i)).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});
