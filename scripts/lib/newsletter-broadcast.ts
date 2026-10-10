/** Fail closed and search every page before allowing an issue to be sent again.
 * API contract: https://resend.com/docs/api-reference/broadcasts/list-broadcasts
 */
export async function alreadySent(name: string, key: string): Promise<boolean> {
  const url = new URL('https://api.resend.com/broadcasts?limit=100');
  const cursors = new Set<string>();
  while (true) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Broadcast lookup failed (HTTP ${response.status}); sendout held`);
    const page = await response.json() as {
      data?: { id: string; name: string; status: string }[];
      has_more?: boolean;
    };
    if (!Array.isArray(page.data) || typeof page.has_more !== 'boolean' || page.data.some(item =>
      !item || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.status !== 'string')) {
      throw new Error('Invalid broadcast lookup response; sendout held');
    }
    if (page.data.some(broadcast => broadcast.name === name && broadcast.status !== 'draft')) return true;
    if (!page.has_more) return false;
    const cursor = page.data.at(-1)?.id;
    if (!cursor || cursors.has(cursor)) throw new Error('Invalid broadcast pagination; sendout held');
    cursors.add(cursor);
    url.searchParams.set('after', cursor);
  }
}
