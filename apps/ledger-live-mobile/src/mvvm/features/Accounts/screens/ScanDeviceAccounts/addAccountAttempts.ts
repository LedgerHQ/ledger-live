const PENDING_RETRY_MS = 10 * 60 * 1000;

type AttemptScope = {
  currencyId: string;
  context?: string;
  journeyKey?: string;
};

const pendingRetryByCurrencyAndContext = new Map<
  string,
  { journeyKey: string; attempt: number; markedAt: number }
>();

const toScopeKey = ({ currencyId, context }: AttemptScope) =>
  JSON.stringify([currencyId, context ?? null]);

export function markRetryPending({ attempt, ...scope }: AttemptScope & { attempt: number }): void {
  if (scope.journeyKey === undefined) return;
  pendingRetryByCurrencyAndContext.set(toScopeKey(scope), {
    journeyKey: scope.journeyKey,
    attempt,
    markedAt: Date.now(),
  });
}

export function consumeRetryAttempt(scope: AttemptScope): number {
  const key = toScopeKey(scope);
  const pending = pendingRetryByCurrencyAndContext.get(key);
  pendingRetryByCurrencyAndContext.delete(key);
  if (!pending || scope.journeyKey === undefined || pending.journeyKey !== scope.journeyKey) {
    return 0;
  }
  if (Date.now() - pending.markedAt >= PENDING_RETRY_MS) return 0;
  return pending.attempt;
}
