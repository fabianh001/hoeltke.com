import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

// Exercise the real CLI and rss-parser: redirects with an unread body can keep
// a socket referenced long after the digest has finished its work.
describe('digest CLI connection cleanup', () => {
  it.each([true, false])('exits after redirected feeds (fresh items: %s)', async fresh => {
    const server = createServer((request, response) => {
      if (request.url === '/redirect') {
        response.writeHead(302, { Location: '/feed' });
        response.end('Redirecting to the feed');
        return;
      }
      response.setHeader('Content-Type', 'application/rss+xml');
      const item = fresh ? `<item><title>A fresh model release</title><link>https://example.test/model</link><pubDate>${new Date().toUTCString()}</pubDate></item>` : '';
      response.end(`<rss version="2.0"><channel><title>Fixture feed</title>${item}</channel></rss>`);
    });
    server.keepAliveTimeout = 600_000;
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing fixture server address');
    const script = resolve('scripts/generate-digest.ts');
    const code = `
      import Parser from 'rss-parser';
      const parseURL = Parser.prototype.parseURL;
      Parser.prototype.parseURL = function (url, ...args) {
        return parseURL.call(this, url.startsWith('http://127.0.0.1:') ? url : ${JSON.stringify(`http://127.0.0.1:${address.port}/redirect`)}, ...args);
      };
      // HN is the only fetch consumer in --dry-run; keep this test offline.
      globalThis.fetch = async () => new Response(JSON.stringify({ hits: [], nbPages: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
      process.argv = [process.execPath, ${JSON.stringify(script)}, '--dry-run'];
      await import(${JSON.stringify(pathToFileURL(script).href)});
    `;
    try {
      const result = await new Promise<{ code: number | null; signal: string | null; stdout: string; stderr: string }>((resolve, reject) => {
        const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', code], {
          stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, OPENROUTER_API_KEY: '' },
        });
        let stdout = '';
        let stderr = '';
        let exitDeadline: ReturnType<typeof setTimeout> | undefined;
        const startupDeadline = setTimeout(() => child.kill('SIGKILL'), 10_000);
        const completed = () => {
          if (!exitDeadline) exitDeadline = setTimeout(() => child.kill('SIGKILL'), 1000);
        };
        child.stdout.on('data', chunk => {
          stdout += chunk;
          if (stdout.includes('--dry-run: skipping the model call')) completed();
        });
        child.stderr.on('data', chunk => {
          stderr += chunk;
          if (stderr.includes('digest generation failed:')) completed();
        });
        child.on('error', error => {
          clearTimeout(startupDeadline); clearTimeout(exitDeadline);
          reject(error);
        });
        child.on('close', (code, signal) => {
          clearTimeout(startupDeadline); clearTimeout(exitDeadline);
          resolve({ code, signal, stdout, stderr });
        });
      });
      if (fresh) expect(result.stdout).toContain('--dry-run: skipping the model call');
      else expect(result.stderr).toContain('no fresh items collected');
      expect(result.signal, result.stderr).toBeNull();
      expect(result.code, result.stderr).toBe(fresh ? 0 : 1);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  }, 15_000);
});
