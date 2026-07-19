/** Lightweight client-side sanity check; the double-opt-in email is the real validation. */
export function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}
