import type { LogEvent, TransactionLogger } from "./logEvent";

/**
 * Global registry of transaction log-event observers.
 *
 * The account bridge is resolved through the global `getAccountBridge`, not React context,
 * so host apps cannot pass a sink down as a prop. Instead each host registers an observer
 * once at startup and the bridge emits into it — the same fire-and-forget pattern as
 * `@ledgerhq/logs` `listen`/`dispatch`.
 *
 * Multiple observers can coexist (e.g. Segment, operational monitoring, and a dev console),
 * and each one owns its applicable transmission policy — see {@link setTransactionObserver}.
 */
const observers: TransactionLogger[] = [];

/**
 * Register a transaction observer. Returns an unsubscribe function.
 *
 * **An observer is responsible for its own transmission policy.** Events are emitted from the
 * bridge seam unconditionally, because this package cannot read host settings. Analytics sinks
 * must enforce analytics consent; approved count-only operational monitoring instead enforces
 * its rollout flag and strict wire allow-list.
 *
 * There is no single gate to inherit, because sinks answer to different consents: Segment and
 * Mixpanel are governed by the analytics opt-in, while Datadog is governed by the separate
 * crash/error-reporting opt-in (plus its own feature flag). A user may accept one and decline
 * the other, so one sink must not assume another sink's gate.
 *
 * In practice: forward analytics through the host's self-gated `track`, or apply the relevant
 * operational policy before transmitting. Sinks that never leave the process need no gate.
 */
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
 * Each observer is isolated in a `try/catch`: a throwing sink must never break the
 * transaction it is observing.
 */
export function emitTransactionEvent(event: LogEvent): void {
  for (const observer of observers) {
    try {
      observer(event);
    } catch (error) {
      // warn, not error: a throwing sink is the recoverable case this registry exists to
      // absorb, and console.error is forwarded to monitoring as an error event.
      console.warn("transaction observer threw", error);
    }
  }
}
