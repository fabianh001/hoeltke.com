import { afterEach, describe, expect, it, vi } from 'vitest';
import { alreadySent } from '../../scripts/lib/newsletter-broadcast';

afterEach(() => vi.unstubAllGlobals());

describe('newsletter duplicate-send protection', () => {
  it('holds sending when the broadcast lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })));
    await expect(alreadySent('ai-weekly-2026-40', 'test-key')).rejects.toThrow(/503/);
  });
  it('finds previously sent issues beyond the first page', async () => {
    vi.stubGlobal('fetch', async (url: URL) => {
      if (url.searchParams.get('after') === 'first') return Response.json({ object: 'list', has_more: false, data: [{ id: 'sent', name: 'ai-weekly-2026-40', status: 'sent' }] });
      return Response.json({ object: 'list', has_more: true, data: [{ id: 'first', name: 'another-issue', status: 'sent' }] });
    });
    await expect(alreadySent('ai-weekly-2026-40', 'test-key')).resolves.toBe(true);
  });
  it('allows real sends after a test draft', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ object: 'list', has_more: false, data: [{ id: 'draft', name: 'ai-weekly-2026-40', status: 'draft' }] })));
    await expect(alreadySent('ai-weekly-2026-40', 'test-key')).resolves.toBe(false);
  });
  it('holds sending when pagination repeats instead of reaching the end', async () => {
    vi.stubGlobal('fetch', () => Response.json({ object: 'list', has_more: true, data: [{ id: 'same', name: 'another-issue', status: 'sent' }] }));
    await expect(alreadySent('ai-weekly-2026-40', 'test-key')).rejects.toThrow(/pagination/);
  });
  it('holds sending on malformed broadcast lookup responses' , async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'bad data' })));
    await expect(alreadySent('ai-weekly-2026-40', 'test-key')).rejects.toThrow(/Invalid/);
  });
});
