import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface TerminalIssue {
  issue: number;
  title: string;
  description: string;
  date: string;
  slug: string;
}

interface Props {
  issues: TerminalIssue[];
}

type Line = { id: number; node: ReactNode };

const CHUCK_JOKES = [
  'Chuck Norris writes code that optimizes itself.',
  "Chuck Norris's keyboard has no Ctrl key. Chuck Norris is always in control.",
  'Chuck Norris can unit test an entire application with a single assert.',
  "Chuck Norris doesn't need garbage collection. Memory cleans up after him out of respect.",
  'Chuck Norris can access private methods.',
  "Chuck Norris's LLM has no context limit. Context limits have a Chuck Norris limit.",
  'Chuck Norris deploys on Fridays.',
  'Chuck Norris merges without resolving conflicts. Conflicts resolve themselves.',
];

const SUGGESTED = ['help', 'latest', 'whoami', 'subscribe', 'chuck'];

const BOOT_LINES = [
  '▸ booting hoeltke.com v2 … ok',
  '▸ ingesting feeds        … ok',
  '▸ summarizing week       … 200 OK',
];

let lineId = 0;
const mkLine = (node: ReactNode): Line => ({ id: ++lineId, node });

export default function Terminal({ issues }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [booted, setBooted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bootStarted = useRef(false);

  const append = useCallback((...nodes: ReactNode[]) => {
    setLines((prev) => [...prev, ...nodes.map(mkLine)]);
  }, []);

  const latest = issues[0];

  const renderIssueLink = (i: TerminalIssue) => (
    <span>
      <span className="text-faint">#{String(i.issue).padStart(2, '0')}</span>{' '}
      <a href={i.slug} className="text-accent hover:underline">
        {i.title}
      </a>{' '}
      <span className="text-faint">({i.date})</span>
    </span>
  );

  const commands: Record<string, { desc?: string; run: (arg: string) => ReactNode[] | 'clear' }> =
    useMemo(
      () => ({
        help: {
          desc: 'list available commands',
          run: () => [
            <span className="text-muted">available commands:</span>,
            ...[
              ['latest', 'open the newest AI Weekly issue'],
              ['issues', 'list recent issues'],
              ['subscribe', 'stay up to date (RSS)'],
              ['whoami', 'who runs this thing'],
              ['about', 'go to the about page'],
              ['theme', 'toggle dark/light'],
              ['clear', 'clear the screen'],
            ].map(([cmd, desc]) => (
              <span>
                {'  '}
                <span className="text-green">{cmd.padEnd(11)}</span>
                <span className="text-muted">{desc}</span>
              </span>
            )),
            <span className="text-faint">…and a few that aren't listed. explore.</span>,
          ],
        },
        latest: {
          run: () =>
            latest
              ? [
                  <span className="text-muted">newest issue:</span>,
                  renderIssueLink(latest),
                  <span className="text-muted">{latest.description}</span>,
                ]
              : [<span className="text-red">no issues yet — the pipeline runs on Fridays.</span>],
        },
        issues: {
          run: () =>
            issues.length > 0
              ? [
                  <span className="text-muted">{issues.length} most recent:</span>,
                  ...issues.map((i) => renderIssueLink(i)),
                  <span>
                    <span className="text-faint">full archive → </span>
                    <a href="/digest" className="text-accent hover:underline">
                      /digest
                    </a>
                  </span>,
                ]
              : [<span className="text-red">no issues yet.</span>],
        },
        subscribe: {
          run: () => [
            <span>
              <span className="text-muted">one issue every Friday. grab the feed: </span>
              <a href="/rss.xml" className="text-amber hover:underline">
                /rss.xml
              </a>
            </span>,
          ],
        },
        whoami: {
          run: () => [
            <span>
              Fabian Hoeltke — frontend <span className="text-faint">×</span> design{' '}
              <span className="text-faint">×</span> AI
            </span>,
            <span>
              AI Engineer @ <span className="text-accent">Datadog</span>, building the internal
              Cursor
            </span>,
            <span>
              <span className="text-faint">more → </span>
              <a href="/about" className="text-accent hover:underline">
                /about
              </a>
            </span>,
          ],
        },
        about: {
          run: () => {
            window.location.href = '/about';
            return [<span className="text-muted">opening /about …</span>];
          },
        },
        theme: {
          run: () => {
            const next = (window as any).__setTheme?.();
            return [<span className="text-muted">theme set to {next}.</span>];
          },
        },
        clear: { run: () => 'clear' },
        // ── unlisted ────────────────────────────────────────────────
        ls: {
          run: () => [
            <span>
              <span className="text-accent">digest/</span>{' '}
              <span className="text-accent">about/</span>{' '}
              <span className="text-green">rss.xml</span>{' '}
              <span className="text-faint">.secrets/</span>
            </span>,
          ],
        },
        pwd: { run: () => [<span>/home/fabian/hoeltke.com</span>] },
        cd: {
          run: (arg) => {
            const target = arg.trim();
            if (/travel/.test(target)) {
              setTimeout(() => (window.location.href = '/travel'), 900);
              return [
                <span className="text-muted">
                  found a dusty old directory from Australia 🇦🇺 … opening
                </span>,
              ];
            }
            if (target === '' || target === '~') return [];
            return [<span className="text-red">cd: no such directory: {target}</span>];
          },
        },
        chuck: {
          run: () => [
            <span className="text-amber">
              {CHUCK_JOKES[Math.floor(Math.random() * CHUCK_JOKES.length)]}
            </span>,
          ],
        },
        sudo: {
          run: (arg) =>
            /make\s+coffee/.test(arg)
              ? [
                  <span className="text-amber">☕ brewing …</span>,
                  <span className="text-muted">
                    418 I'm a teapot — coffee module not installed. try the digest instead.
                  </span>,
                ]
              : [<span className="text-red">fabian is not in the sudoers file. this incident will be reported.</span>],
        },
        make: {
          run: (arg) =>
            /coffee/.test(arg)
              ? [<span className="text-red">make: *** insufficient permissions. try sudo.</span>]
              : [<span className="text-red">make: *** no rule to make target '{arg || '?'}'.</span>],
        },
        vim: {
          run: () => [
            <span className="text-muted">entering vim …</span>,
            <span className="text-amber">you're stuck now. (hint: this terminal has no :q)</span>,
          ],
        },
        top: {
          run: () => [
            <span className="text-faint">{'  PID  %CPU  COMMAND'}</span>,
            <span>{'    1  99.2  neural-net'}</span>,
            <span>{'    7  42.0  feed-ingester'}</span>,
            <span>{'   13   3.1  caddy'}</span>,
            <span>{'  404   0.0  imposter-syndrome  '}<span className="text-green">[killed]</span></span>,
          ],
        },
        cat: {
          run: (arg) =>
            /secret/i.test(arg)
              ? [<span className="text-amber">nice try. the only secret here is in ~/travel</span>]
              : [<span className="text-red">cat: {arg || '?'}: no such file</span>],
        },
        echo: { run: (arg) => [<span>{arg}</span>] },
        exit: {
          run: () => [
            <span className="text-muted">there is no exit. only the digest.</span>,
          ],
        },
        datadog: {
          run: () => [
            <span className="text-muted">
              woof. <span className="text-accent">monitoring everything</span> since breakfast. 🐶
            </span>,
          ],
        },
      }),
      [issues]
    );

  const prompt = (
    <span className="select-none">
      <span className="text-prompt">fabian</span>
      <span className="text-faint">:~$</span>
    </span>
  );

  const runCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      append(
        <span>
          {prompt} {trimmed}
        </span>
      );
      if (!trimmed) return;
      setHistory((h) => [trimmed, ...h]);
      setHistoryIdx(-1);

      const [cmd, ...rest] = trimmed.split(/\s+/);
      const arg = rest.join(' ');
      const entry = commands[cmd.toLowerCase()];
      if (!entry) {
        append(
          <span className="text-red">
            command not found: {cmd} <span className="text-faint">— try 'help'</span>
          </span>
        );
        return;
      }
      const result = entry.run(arg);
      if (result === 'clear') {
        setLines([]);
        return;
      }
      append(...result);
    },
    [append, commands]
  );

  // boot sequence
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finishBoot = () => {
      append(
        <span>
          {prompt} <span className="text-ink">latest</span>
        </span>,
        ...(latest
          ? [
              <span className="text-muted">newest issue:</span>,
              renderIssueLink(latest),
              <span className="text-faint">type 'help' to look around.</span>,
            ]
          : [<span className="text-faint">type 'help' to look around.</span>])
      );
      setBooted(true);
    };

    if (reduced) {
      append(...BOOT_LINES.map((l) => <span className="text-faint">{l}</span>));
      finishBoot();
      return;
    }

    BOOT_LINES.forEach((l, i) => {
      setTimeout(() => append(<span className="text-faint">{l}</span>), 350 * (i + 1));
    });
    setTimeout(finishBoot, 350 * (BOOT_LINES.length + 1));
  }, []);

  // keep scrolled to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, history.length - 1);
      if (history[next]) {
        setHistoryIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = historyIdx - 1;
      setHistoryIdx(next);
      setInput(next >= 0 ? history[next] : '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const matches = Object.keys(commands).filter((c) => c.startsWith(input.toLowerCase()));
      if (matches.length === 1) setInput(matches[0] + ' ');
      else if (matches.length > 1 && input)
        append(<span className="text-faint">{matches.join('  ')}</span>);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      className="crt rounded-xl border border-line bg-panel/80 shadow-[0_0_50px_var(--glow)] backdrop-blur-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red/80" />
        <span className="size-2.5 rounded-full bg-amber/80" />
        <span className="size-2.5 rounded-full bg-green/80" />
        <span className="ml-2 font-mono text-xs text-faint">fabian — zsh</span>
      </div>

      {/* output */}
      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-6 sm:h-80 sm:text-sm"
        aria-live="polite"
      >
        {lines.map((l) => (
          <div key={l.id} className="break-words whitespace-pre-wrap">
            {l.node}
          </div>
        ))}

        {booted && (
          <div className="flex items-center gap-2">
            {prompt}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="min-w-0 flex-1 bg-transparent text-ink caret-[var(--prompt)] outline-none"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Terminal input"
              enterKeyHint="send"
            />
          </div>
        )}
        {!booted && (
          <div>
            <span className="cursor-block" />
          </div>
        )}
      </div>

      {/* suggested commands — main door on mobile, shortcut on desktop */}
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-2.5">
        {SUGGESTED.map((cmd) => (
          <button
            key={cmd}
            onClick={(e) => {
              e.stopPropagation();
              runCommand(cmd);
              inputRef.current?.focus();
            }}
            className="cursor-pointer rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted transition-colors hover:border-line-bright hover:text-accent"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
