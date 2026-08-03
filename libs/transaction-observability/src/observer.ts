import type { LogEvent, TransactionLogger } from "./logEvent";

/**
 * Global registry of transaction log-event observers.
 *
 * The account bridge (`wrapAccountBridge`) is resolved through the global
 * `getAccountBridge`, not React context, so host apps cannot pass a sink down as
 * a prop. Instead each host app registers an observer once at startup and the
 * bridge emits into it — the same fire-and-forget pattern as `@ledgerhq/logs`
 * `listen`/`dispatch`.
 *
 * Multiple observers can coexist (e.g. a Datadog sink + a dev console sink).
 */
const observers: TransactionLogger[] = [];

/** Register a transaction observer. Returns an unsubscribe function. */
export function setTransactionObserver(observer: TransactionLogger): () => void {
  observers.push(observer);
  return () => {
    const index = observers.indexOf(observer);
    if (index !== -1) observers.splice(index, 1);
  };
}

/** Remove all observers. Intended for tests. */
export function resetTransactionObservers(): void {
  observers.length = 0;
}

/**
 * Emit a transaction log event to every registered observer.
 *
 * Each observer is isolated in a `try/catch`: a throwing sink must never break
 * the transaction (sign/broadcast) path it is observing.
 */
export function emitTransactionEvent(event: LogEvent): void {
  for (const observer of observers) {
    try {
      observer(event);
    } catch (error) {
      // A broken sink must not affect the transaction flow.
      console.error("transaction observer threw", error);
    }
  }
}
