/**
 * An inline Retry after a scan error goes back to the device selection that opened the scan, and
 * reconnecting opens a new scan screen. The retried attempt waits here, under the key of that
 * device selection screen, so the new scan screen goes on counting from it. A journey opened anew
 * has a new device selection screen, so a retry it never resumed cannot carry over to it.
 */
const PENDING_RETRY_MS = 10 * 60 * 1000;

type AttemptScope = {
  currencyId: string;
  context?: string;
  /** Key of the device selection screen the scan was opened from. Without it, nothing carries over. */
  journeyKey?: string;
};

/** At most one pending retry per currency and context: a newer journey replaces or drops it. */
const pendingRetries = new Map<string, { journeyKey: string; attempt: number; markedAt: number }>();

const toScopeKey = ({ currencyId, context }: AttemptScope) =>
  JSON.stringify([currencyId, context ?? null]);

/** Records the attempt an inline Retry leaves, for the scan screen its journey reopens. */
export function markRetryPending({ attempt, ...scope }: AttemptScope & { attempt: number }): void {
  if (scope.journeyKey === undefined) return;
  pendingRetries.set(toScopeKey(scope), {
    journeyKey: scope.journeyKey,
    attempt,
    markedAt: Date.now(),
  });
}

/**
 * Takes the attempt a Retry left in the same journey, currency and context: the next operation
 * counts from it. Returns 0 for another journey, without a journey key, or after 10 minutes. The
 * pending retry of this currency and context is dropped either way.
 */
export function consumeRetryAttempt(scope: AttemptScope): number {
  const key = toScopeKey(scope);
  const pending = pendingRetries.get(key);
  pendingRetries.delete(key);
  if (!pending || scope.journeyKey === undefined || pending.journeyKey !== scope.journeyKey) {
    return 0;
  }
  if (Date.now() - pending.markedAt >= PENDING_RETRY_MS) return 0;
  return pending.attempt;
}
