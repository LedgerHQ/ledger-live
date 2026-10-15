import { AccountDataAbortedError } from "./errors";

export type Limiter = <T>(task: () => Promise<T>, signal?: AbortSignal) => Promise<T>;

/** At most `limit` tasks running; the rest wait their turn, or leave the queue when aborted. */
export function createLimiter(limit: number): Limiter {
  let active = 0;
  const queue: Array<() => void> = [];

  function release() {
    const next = queue.shift();
    if (next) next();
    else active--;
  }

  return async function run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) throw new AccountDataAbortedError();
    if (active < limit) {
      active++;
    } else {
      // `release` hands its slot over, so `active` is not touched on the way in.
      await new Promise<void>((resolve, reject) => {
        const start = () => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        };
        const onAbort = () => {
          const index = queue.indexOf(start);
          if (index >= 0) queue.splice(index, 1);
          reject(new AccountDataAbortedError());
        };
        queue.push(start);
        signal?.addEventListener("abort", onAbort, { once: true });
      });
    }
    try {
      if (signal?.aborted) throw new AccountDataAbortedError();
      return await task();
    } finally {
      release();
    }
  };
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

/** Stops this caller waiting on `answer` when `signal` aborts, without cancelling `answer` itself. */
export function stopWaitingOnAbort<T>(answer: Promise<T>, signal: AbortSignal): Promise<T> {
  let onAbort: () => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(new AccountDataAbortedError());
    signal.addEventListener("abort", onAbort, { once: true });
  });
  return Promise.race([answer, aborted]).finally(() =>
    signal.removeEventListener("abort", onAbort),
  );
}
