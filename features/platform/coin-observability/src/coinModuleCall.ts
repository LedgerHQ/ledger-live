/**
 * One coin-module method call, as seen at the resolver.
 *
 * Deliberately carries neither the arguments nor the result: both hold addresses, amounts and
 * raw transactions. What is reported is enough to count calls, time them and tell failures
 * apart, per method and per currency.
 */
export type CoinModuleCallEvent = {
  method: string;
  /** The currency id the module was resolved for (e.g. "ripple", "ethereum"). */
  network: string;
  family: string;
  durationMs: number;
  /**
   * `not_supported` is a call to a capability the module omits, answered by the `withDefaults`
   * stub. It is a consumer calling something it should have checked with `supports()`, not a
   * chain failure, so it is kept out of the failure rate.
   */
  status: "success" | "failure" | "not_supported";
  errorName?: string;
  /**
   * The error's message, already sanitized by the emitter: long hex and encoded runs (transactions,
   * addresses, keys) replaced and the length capped. Never the raw text.
   */
  errorMessage?: string;
  /** Normalized cause, classified by the emitter; this package stays free of legacy imports. */
  errorCategory?: string;
};

export type CoinModuleCallObserver = (event: CoinModuleCallEvent) => void;

/**
 * Global registry, for the same reason as `setTransactionObserver` in
 * `@ledgerhq/transaction-observability`: the coin-module is resolved through a global, not React
 * context, so a host cannot pass a sink down. Each host registers its observers once at startup,
 * and each observer owns its transmission policy (consent, sampling).
 */
const observers: CoinModuleCallObserver[] = [];

export function setCoinModuleCallObserver(observer: CoinModuleCallObserver): () => void {
  observers.push(observer);
  return () => {
    const index = observers.indexOf(observer);
    if (index !== -1) observers.splice(index, 1);
  };
}

/** Remove all observers. Intended for tests. */
export function resetCoinModuleCallObservers(): void {
  observers.length = 0;
}

/** Lets an emitter skip timing and event construction when nobody listens. */
export function hasCoinModuleCallObservers(): boolean {
  return observers.length > 0;
}

export function emitCoinModuleCall(event: CoinModuleCallEvent): void {
  for (const observer of observers) {
    try {
      observer(event);
    } catch (error) {
      // A throwing sink must never break the coin-module call it is observing.
      console.warn("coin-module call observer threw", error);
    }
  }
}
