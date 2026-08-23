import { useEffect, useState } from 'react';
import { isValidEmail } from '../lib/email';

interface Props {
  /** Called once the flow completes, so the terminal can return focus to its input. */
  onDone?: () => void;
}

/** Inline terminal email entry → POST /api/subscribe → optimistic confirmation. */
export function TerminalSubscribe({ onDone }: Props) {
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  // When the inline input unmounts on completion, hand focus back to the caller
  // (the terminal's main input). Fires once — `done` never flips back.
  useEffect(() => {
    if (done) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    return <span className="text-green">✓ check your inbox to confirm.</span>;
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ignore an empty submit — e.g. the same Enter that ran `subscribe` reaches
    // the freshly-focused field. Only validate once something's been typed.
    if (!value.trim()) return;
    if (!isValidEmail(value)) {
      setError(true);
      return;
    }
    // Fire-and-forget: the double-opt-in email is the real validation.
    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: value.trim() }),
    }).catch(() => {});
    setDone(true);
  };

  return (
    <span>
      <form onSubmit={onSubmit}>
        <span className="text-faint">enter email › </span>
        <input
          autoFocus
          name="email"
          placeholder="you@example.com"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          className="border-0 bg-transparent text-ink outline-none"
          style={{ width: '16rem' }}
        />
      </form>
      {error && (
        <span className="text-red">that doesn't look like an email — try again.</span>
      )}
    </span>
  );
}
