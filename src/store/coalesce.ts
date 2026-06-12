/**
 * Tracks the last "coalescing key" so consecutive patches that share that
 * key (e.g. typing into the same field of the same node) skip recording
 * a history entry — they extend the previous one in place.
 *
 * Using monotonic `performance.now()` instead of `Date.now()` so the
 * scheduler can't make us think a long stall is two separate edits.
 */

export const COALESCE_WINDOW_MS = 700;

let lastKey: string | null = null;
let lastAt = 0;

function now(): number {
  return typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : 0;
}

/**
 * Returns true when the caller should push a fresh history snapshot.
 * Side effect: updates the last-seen key/time so subsequent calls in
 * the same window collapse.
 *
 * `key` should encode (entityKind, id, field-set) — pass any string.
 */
export function shouldPushFor(key: string): boolean {
  const t = now();
  if (lastKey === key && t - lastAt < COALESCE_WINDOW_MS) {
    lastAt = t;
    return false;
  }
  lastKey = key;
  lastAt = t;
  return true;
}

/** Force the next coalesced call to start a new history entry. */
export function flushCoalesce(): void {
  lastKey = null;
  lastAt = 0;
}
