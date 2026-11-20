/**
 * An inline Retry after a scan error goes back to device selection, which opens a new scan screen.
 * The retried attempt waits here so the new screen goes on counting from it.
 */
const PENDING_RETRY_MS = 10 * 60 * 1000;

type AttemptScope = { currencyId: string; context?: string };

const pendingRetries = new Map<string, { attempt: number; markedAt: number }>();

const toScopeKey = ({ currencyId, context }: AttemptScope) =>
  JSON.stringify([currencyId, context ?? null]);

/** Records the attempt an inline Retry leaves, for the scan screen it reopens. */
export function markRetryPending({
  currencyId,
  context,
  attempt,
}: AttemptScope & { attempt: number }): void {
  pendingRetries.set(toScopeKey({ currencyId, context }), { attempt, markedAt: Date.now() });
}

/**
 * Takes the attempt a Retry left for this currency and context: the next operation counts from
 * it. Returns 0 when there is none, or when it is older than 10 minutes.
 */
export function consumeRetryAttempt(scope: AttemptScope): number {
  const key = toScopeKey(scope);
  const pending = pendingRetries.get(key);
  pendingRetries.delete(key);
  if (!pending || Date.now() - pending.markedAt >= PENDING_RETRY_MS) return 0;
  return pending.attempt;
}
