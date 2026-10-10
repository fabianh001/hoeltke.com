import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = resolve('scripts/publish-digest-audio.sh');
const directories: string[] = [];
afterEach(() => {
  directories.forEach(path => rmSync(path, { recursive: true, force: true }));
  directories.length = 0;
});
function git(cwd: string, ...args: string[]) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'audio-publish-'));
  directories.push(root);
  const origin = join(root, 'origin.git');
  const editor = join(root, 'editor');
  const worker = join(root, 'worker');
  git(root, 'init', '--bare', '--initial-branch=main', origin);
  git(root, 'clone', origin, editor);
  git(editor, 'config', 'user.name', 'Reviewer');
  git(editor, 'config', 'user.email', 'reviewer@example.test');
  mkdirSync(join(editor, 'src/content/digest'), { recursive: true });
  writeFileSync(join(editor, 'src/content/digest/2026-40.md'), 'Final reviewed copy');
  writeFileSync(join(editor, 'README.md'), 'Initial site');
  git(editor, 'add', '.'); git(editor, 'commit', '-m', 'Approve issue'); git(editor, 'push', 'origin', 'main');
  const approved = git(editor, 'rev-parse', 'HEAD');
  git(root, 'clone', origin, worker); git(worker, 'checkout', '--detach', approved);
  mkdirSync(join(worker, 'public/audio/digest'), { recursive: true });
  writeFileSync(join(worker, 'public/audio/digest/2026-40.mp3'), 'Approved narration');
  writeFileSync(join(worker, 'public/audio/digest/2026-40.json'), '{}');
  const output = join(root, 'output'); writeFileSync(output, '');
  const run = (mode: string) => spawnSync('bash', [script, mode, '2026-40'], { cwd: worker, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: output } });
  return { root, editor, worker, approved, output, run };
}

describe('audio publication integration', () => {
  it('preserves concurrent site changes while publishing only audio', () => {
    const { editor, output, run } = fixture();
    writeFileSync(join(editor, 'README.md'), 'Concurrent site change');
    git(editor, 'add', '.'); git(editor, 'commit', '-m', 'Update site'); git(editor, 'push', 'origin', 'main');
    const result = run('publish');
    expect(result.status, result.stderr).toBe(0);
    git(editor, 'pull', '--ff-only');
    expect(readFileSync(join(editor, 'README.md'), 'utf8')).toBe('Concurrent site change');
    expect(readFileSync(join(editor, 'src/content/digest/2026-40.md'), 'utf8')).toBe('Final reviewed copy');
    expect(readFileSync(join(editor, 'public/audio/digest/2026-40.mp3'), 'utf8')).toBe('Approved narration');
    expect(readFileSync(output, 'utf8').trim()).toBe(`revision=${git(editor, 'rev-parse', 'HEAD')}`);
    expect(git(editor, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').split('\n')).toEqual(['public/audio/digest/2026-40.json', 'public/audio/digest/2026-40.mp3']);
  });
  it('holds publication when the approved copy was superseded on main', () => {
    const { editor, run } = fixture();
    writeFileSync(join(editor, 'src/content/digest/2026-40.md'), 'Newer reviewed copy');
    git(editor, 'add', '.'); git(editor, 'commit', '-m', 'Edit approved issue'); git(editor, 'push', 'origin', 'main');
    const result = run('publish');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Reviewed copy changed');
    git(editor, 'fetch', 'origin', 'main');
    expect(git(editor, 'rev-parse', 'HEAD')).toBe(git(editor, 'rev-parse', 'origin/main'));
  });
  it('restores completed audio when rerunning the original merged revision', () => {
    const { worker, approved, run } = fixture();
    expect(run('publish').status).toBe(0);
    git(worker, 'checkout', '--detach', approved);
    expect(run('restore').status).toBe(0);
    expect(readFileSync(join(worker, 'public/audio/digest/2026-40.mp3'), 'utf8')).toBe('Approved narration');
    expect(run('publish').status).toBe(0);
    expect(git(worker, 'rev-parse', 'HEAD')).toBe(git(worker, 'rev-parse', 'origin/main'));
  });
  it('checks the approved copy without committing or pushing anything', () => {
    const { worker, approved, run } = fixture();
    expect(run('check').status).toBe(0);
    expect(git(worker, 'rev-parse', 'origin/main')).toBe(approved);
  });
});
