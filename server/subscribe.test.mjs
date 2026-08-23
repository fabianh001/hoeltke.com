import { createServer } from 'node:http';
import { expect, test, vi } from 'vitest';
import { makeToken, verifyToken, createHandler } from './subscribe.mjs';

const SECRET = 'test-secret';
const ENV = { RESEND_API_KEY: 'k', RESEND_SEGMENT_ID: 'seg', SUBSCRIBE_HMAC_SECRET: SECRET };
const TEMPLATE = { subject: 'confirm', html: '<a href="{{confirm_url}}">go</a>' };

/** Run one request against a fresh handler; returns { status, headers, body }. */
async function request(handler, path, init = {}) {
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { redirect: 'manual', ...init });
  const body = await res.text();
  server.close();
  return { status: res.status, headers: res.headers, body };
}

test('token round-trips and rejects tampering/expiry', () => {
  const token = makeToken('a@b.co', SECRET);
  expect(verifyToken(token, SECRET)).toBe('a@b.co');
  expect(verifyToken(token + 'x', SECRET)).toBeNull();
  expect(verifyToken(token, 'other-secret')).toBeNull();
  const future = Date.now() + 49 * 60 * 60 * 1000; // past the 48 h TTL
  expect(verifyToken(token, SECRET, future)).toBeNull();
});

test('verifyToken round-trips an email containing | in the local part', () => {
  // '|' is legal in an email local part and passes EMAIL_RE; the payload is
  // `email|expiry`, so the split must anchor on the LAST '|', not the first.
  expect(verifyToken(makeToken('a|b@x.co', SECRET), SECRET)).toBe('a|b@x.co');
});

test('subscribe sends a confirmation email with a valid confirm link', async () => {
  const sent = vi.fn().mockResolvedValue({ ok: true });
  const { status, body } = await request(createHandler(ENV, sent, TEMPLATE), '/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'a@b.co' }),
  });
  expect(status).toBe(200);
  expect(JSON.parse(body).ok).toBe(true);
  const [url, opts] = sent.mock.calls[0];
  expect(url).toBe('https://api.resend.com/emails');
  const payload = JSON.parse(opts.body);
  expect(payload.to).toEqual(['a@b.co']);
  const confirmUrl = payload.html.match(/href="([^"]+)"/)[1];
  const token = new URL(confirmUrl).searchParams.get('token');
  expect(verifyToken(token, SECRET)).toBe('a@b.co');
});

test('honeypot pretends success without calling Resend', async () => {
  const sent = vi.fn();
  const { status } = await request(createHandler(ENV, sent, TEMPLATE), '/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'a@b.co', website: 'spam' }),
  });
  expect(status).toBe(200);
  expect(sent).not.toHaveBeenCalled();
});

test('invalid email → 400, no Resend call', async () => {
  const sent = vi.fn();
  const { status } = await request(createHandler(ENV, sent, TEMPLATE), '/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'nope' }),
  });
  expect(status).toBe(400);
  expect(sent).not.toHaveBeenCalled();
});

test('oversized body is rejected (413 or socket error) without wedging the server', async () => {
  const sent = vi.fn();
  const handler = createHandler(ENV, sent, TEMPLATE);
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();

  let status = null;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.co', pad: 'x'.repeat(5000) }), // > 4096 bytes
    });
    status = res.status;
  } catch {
    status = null; // req.destroy() before the response flushes is an acceptable outcome
  }
  if (status !== null) expect(status).toBe(413);

  // the oversized request must not leave a pending readBody() promise / hung connection
  const health = await fetch(`http://127.0.0.1:${port}/api/healthz`);
  expect(health.status).toBe(200);
  expect(sent).not.toHaveBeenCalled();

  server.close();
});

test('form-encoded no-JS subscribe redirects to the pending page', async () => {
  const sent = vi.fn().mockResolvedValue({ ok: true });
  const { status, headers } = await request(createHandler(ENV, sent, TEMPLATE), '/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'email=a%40b.co',
  });
  expect(status).toBe(303);
  expect(headers.get('location')).toBe('https://hoeltke.com/subscribed?s=pending');
});

test('confirm adds the contact to the segment and redirects', async () => {
  const sent = vi.fn().mockResolvedValue({ ok: true, status: 201 });
  const token = makeToken('a@b.co', SECRET);
  const { status, headers } = await request(
    createHandler(ENV, sent, TEMPLATE),
    `/api/confirm?token=${token}`
  );
  expect(status).toBe(303);
  expect(headers.get('location')).toBe('https://hoeltke.com/subscribed');
  const [url, opts] = sent.mock.calls[0];
  expect(url).toBe('https://api.resend.com/contacts');
  expect(JSON.parse(opts.body)).toMatchObject({
    email: 'a@b.co',
    unsubscribed: false,
    segments: [{ id: 'seg' }],
  });
});

test('confirm treats 409 already-exists as success', async () => {
  const sent = vi.fn().mockResolvedValue({ ok: false, status: 409, text: async () => 'exists' });
  const token = makeToken('a@b.co', SECRET);
  const { status, headers } = await request(createHandler(ENV, sent, TEMPLATE), `/api/confirm?token=${token}`);
  expect(status).toBe(303);
  expect(headers.get('location')).toBe('https://hoeltke.com/subscribed');
});

test('bad or expired token redirects to the expired page', async () => {
  const { status, headers } = await request(createHandler(ENV, vi.fn(), TEMPLATE), '/api/confirm?token=garbage');
  expect(status).toBe(303);
  expect(headers.get('location')).toBe('https://hoeltke.com/subscribed?s=expired');
});

test('rate limit kicks in after 5 requests from one IP', async () => {
  const sent = vi.fn().mockResolvedValue({ ok: true });
  const handler = createHandler(ENV, sent, TEMPLATE);
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const post = () =>
    fetch(`http://127.0.0.1:${port}/api/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.co' }),
    });
  let last;
  for (let i = 0; i < 6; i++) last = await post();
  server.close();
  expect(last.status).toBe(429);
});

test('rate limit keys off the last (Caddy-appended) XFF entry, not the spoofable first one', async () => {
  const sent = vi.fn().mockResolvedValue({ ok: true });
  const handler = createHandler(ENV, sent, TEMPLATE);
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  // each request spoofs a different FIRST hop but shares the same appended last
  // hop (the one Caddy itself added) — trusting the last entry must treat these
  // as the same client.
  const post = (i) =>
    fetch(`http://127.0.0.1:${port}/api/subscribe`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `1.2.3.${i}, 9.9.9.9`,
      },
      body: JSON.stringify({ email: 'a@b.co' }),
    });
  let last;
  for (let i = 0; i < 6; i++) last = await post(i);
  server.close();
  expect(last.status).toBe(429);
});

test('honeypot hits still count toward the rate limit', async () => {
  const sent = vi.fn();
  const handler = createHandler(ENV, sent, TEMPLATE);
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const post = () =>
    fetch(`http://127.0.0.1:${port}/api/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.co', website: 'spam' }),
    });
  let last;
  for (let i = 0; i < 6; i++) last = await post();
  server.close();
  expect(last.status).toBe(429);
  expect(sent).not.toHaveBeenCalled();
});
