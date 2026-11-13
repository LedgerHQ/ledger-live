import { abortReason } from "../abort";

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw abortReason(signal);
}

/** A signal and how to stop listening to the signals it was made of. */
export type JoinedSignal = { signal: AbortSignal | undefined; release: () => void };

const noop = () => undefined;

/** Aborts once every signal has; none when one is missing, as that reader can never cancel. */
export function whenAllAborted(signals: readonly (AbortSignal | undefined)[]): JoinedSignal {
  if (signals.length === 0 || signals.includes(undefined)) {
    return { signal: undefined, release: noop };
  }
  const distinct = [...new Set(signals.filter((signal): signal is AbortSignal => !!signal))];
  if (distinct.length === 1) return { signal: distinct[0], release: noop };
  const controller = new AbortController();
  const release = () => distinct.forEach(signal => signal.removeEventListener("abort", check));
  function check() {
    if (!distinct.every(signal => signal.aborted)) return;
    release();
    controller.abort(abortReason(distinct[0]));
  }
  distinct.forEach(signal => signal.addEventListener("abort", check));
  check();
  return { signal: controller.signal, release };
}

/** The promise, or a rejection as soon as the signal aborts. */
export function untilAborted<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortReason(signal));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortReason(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}
