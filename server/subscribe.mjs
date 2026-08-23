// Newsletter subscribe service — zero-dependency Node (node:* only), runs on
// the VPS behind Caddy (`reverse_proxy /api/* 127.0.0.1:8787`).
//
//   POST /api/subscribe  {email, website?}  → HMAC double-opt-in confirmation email
//   GET  /api/confirm?token=…               → add contact to Resend segment, redirect
//   GET  /api/healthz                       → ok
//
// Env (systemd EnvironmentFile): RESEND_API_KEY, RESEND_SEGMENT_ID,
// SUBSCRIBE_HMAC_SECRET, PORT (default 8787).
import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://hoeltke.com';
const RESEND = 'https://api.resend.com';
const FROM = 'AI Weekly <ai-weekly@mail.hoeltke.com>';
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const RATE = { windowMs: 10 * 60 * 1000, max: 5 };
// same check as src/lib/email.ts (inlined — this file must stay dependency-free)
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function makeToken(email, secret, now = Date.now()) {
  const payload = Buffer.from(`${email}|${now + TOKEN_TTL_MS}`).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/** Returns the email for a valid, unexpired token; null otherwise. */
export function verifyToken(token, secret, now = Date.now()) {
  const [payload, sig] = String(token ?? '').split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const decoded = Buffer.from(payload, 'base64url').toString();
  const sep = decoded.lastIndexOf('|'); // email may legally contain '|' in its local part
  if (sep === -1) return null;
  const email = decoded.slice(0, sep);
  const exp = decoded.slice(sep + 1);
  if (!email || !(Number(exp) > now)) return null;
  return email;
}

export function createHandler(env, fetchImpl = fetch, template = null) {
  const confirmTemplate =
    template ??
    JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'confirm-email.json'), 'utf8'));
  const hits = new Map(); // ip → request timestamps inside the window
  const MAX_HITS_ENTRIES = 10_000;

  const limited = (ip, now = Date.now()) => {
    const fresh = (hits.get(ip) ?? []).filter((t) => t > now - RATE.windowMs);
    fresh.push(now);
    hits.set(ip, fresh);
    if (hits.size > MAX_HITS_ENTRIES) {
      // unbounded growth guard: evict IPs with no timestamps left inside the window
      for (const [key, timestamps] of hits) {
        if (!timestamps.some((t) => t > now - RATE.windowMs)) hits.delete(key);
      }
    }
    return fresh.length > RATE.max;
  };

  const readBody = (req) =>
    new Promise((resolve) => {
      let data = '';
      let tooBig = false;
      req.on('data', (c) => {
        if (tooBig) return;
        data += c;
        if (data.length > 4096) {
          tooBig = true;
          req.destroy();
          resolve(null);
        }
      });
      req.on('end', () => {
        if (!tooBig) resolve(data);
      });
      // covers destroyed/aborted connections so the promise never hangs
      req.on('close', () => resolve(null));
    });

  const resendHeaders = {
    authorization: `Bearer ${env.RESEND_API_KEY}`,
    'content-type': 'application/json',
  };

  return async function handler(req, res) {
    const url = new URL(req.url, SITE);
    // Caddy appends the real client IP to any inbound XFF, so the first entry is
    // attacker-controlled; the last entry is the one Caddy itself added.
    const xffParts = String(req.headers['x-forwarded-for'] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const ip = xffParts.length ? xffParts[xffParts.length - 1] : req.socket.remoteAddress;

    if (req.method === 'POST' && url.pathname === '/api/subscribe') {
      const isJson = String(req.headers['content-type'] ?? '').includes('application/json');
      // JSON callers get a JSON status; no-JS form posts get a redirect.
      const done = (status) => {
        if (isJson) {
          res.writeHead(status, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: status < 400 }));
        } else {
          res.writeHead(303, { location: `${SITE}/subscribed?s=pending` });
          res.end();
        }
      };

      const raw = await readBody(req);
      if (raw === null) {
        try {
          res.writeHead(413);
          res.end();
        } catch {
          /* socket may already be gone (destroyed/aborted upload) */
        }
        return;
      }
      let body = {};
      try {
        body = isJson ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
      } catch {
        /* fall through to validation */
      }
      const email = String(body.email ?? '').trim();
      // rate limit runs before the honeypot check so honeypot floods still accumulate
      if (limited(ip)) {
        res.writeHead(429);
        return res.end();
      }
      if (body.website) return done(200); // honeypot: pretend success, tell no one
      if (!EMAIL_RE.test(email)) {
        res.writeHead(400, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: false }));
      }

      const confirmUrl = `${SITE}/api/confirm?token=${makeToken(email, env.SUBSCRIBE_HMAC_SECRET)}`;
      const r = await fetchImpl(`${RESEND}/emails`, {
        method: 'POST',
        headers: resendHeaders,
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject: confirmTemplate.subject,
          html: confirmTemplate.html.replace('{{confirm_url}}', confirmUrl),
        }),
      });
      if (!r.ok) {
        console.error('resend /emails failed:', r.status, await r.text().catch(() => ''));
        res.writeHead(500);
        return res.end();
      }
      return done(200);
    }

    if (req.method === 'GET' && url.pathname === '/api/confirm') {
      const email = verifyToken(url.searchParams.get('token'), env.SUBSCRIBE_HMAC_SECRET);
      if (!email) {
        res.writeHead(303, { location: `${SITE}/subscribed?s=expired` });
        return res.end();
      }
      const r = await fetchImpl(`${RESEND}/contacts`, {
        method: 'POST',
        headers: resendHeaders,
        body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: env.RESEND_SEGMENT_ID }] }),
      });
      // 409 = already a contact — success from the user's point of view
      if (!r.ok && r.status !== 409) {
        console.error('resend /contacts failed:', r.status, await r.text().catch(() => ''));
        res.writeHead(500, { 'content-type': 'text/plain' });
        return res.end('something went wrong — please retry the link from your email.');
      }
      res.writeHead(303, { location: `${SITE}/subscribed` });
      return res.end();
    }

    if (req.method === 'GET' && url.pathname === '/api/healthz') {
      res.writeHead(200);
      return res.end('ok');
    }

    res.writeHead(404);
    res.end();
  };
}

// Started directly (systemd) — not under test.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const k of ['RESEND_API_KEY', 'RESEND_SEGMENT_ID', 'SUBSCRIBE_HMAC_SECRET']) {
    if (!process.env[k]) {
      console.error(`${k} is not set`);
      process.exit(1);
    }
  }
  const port = Number(process.env.PORT ?? 8787);
  createServer(createHandler(process.env)).listen(port, '127.0.0.1', () =>
    console.log(`subscribe service listening on 127.0.0.1:${port}`)
  );
}
