import { PortfolioReadCancelledError } from "./portfolio";

/** A batch's signal, and how to stop listening to the targets' signals once the batch settles. */
export type BatchSignal = { readonly signal: AbortSignal | undefined; release(): void };

const noop = () => undefined;

const isSignal = (signal: AbortSignal | undefined): signal is AbortSignal => signal !== undefined;

/** Aborts once every target's signal has; none when one target cannot be cancelled, as its caller still waits. */
export function cancelledWhenAll(signals: readonly (AbortSignal | undefined)[]): BatchSignal {
  const cancellable = signals.filter(isSignal);
  if (cancellable.length === 0 || cancellable.length < signals.length) {
    return { signal: undefined, release: noop };
  }
  const distinct = [...new Set(cancellable)];
  if (distinct.length === 1) return { signal: distinct[0], release: noop };
  const controller = new AbortController();
  const release = () => distinct.forEach(signal => signal.removeEventListener("abort", abortIfAll));
  function abortIfAll() {
    if (!distinct.every(signal => signal.aborted)) return;
    release();
    controller.abort();
  }
  distinct.forEach(signal => signal.addEventListener("abort", abortIfAll));
  abortIfAll();
  return { signal: controller.signal, release };
}

/** The promise, or a cancellation as soon as `signal` aborts; the promise itself runs on for its other callers. */
export function orCancelled<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    promise.catch(noop);
    return Promise.reject(new PortfolioReadCancelledError());
  }
  return new Promise<T>((resolve, reject) => {
    const cancel = () => reject(new PortfolioReadCancelledError());
    signal.addEventListener("abort", cancel, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", cancel));
  });
}
