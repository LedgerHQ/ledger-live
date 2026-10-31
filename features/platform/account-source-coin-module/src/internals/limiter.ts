export type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

/** At most `limit` tasks running; the rest wait their turn. */
export function createLimiter(limit: number): Limiter {
  let active = 0;
  const queue: Array<() => void> = [];

  function release() {
    const next = queue.shift();
    if (next) next();
    else active--;
  }

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active < limit) active++;
    // `release` hands its slot over, so `active` is not touched on the way in.
    else await new Promise<void>(resolve => queue.push(resolve));
    try {
      return await task();
    } finally {
      release();
    }
  };
}
