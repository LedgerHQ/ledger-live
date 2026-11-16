/** Resolves after `ms`, or as soon as `signal` aborts, also when it already has; either way it leaves no timer nor listener behind. */
export const waitUnlessAborted = (ms: number, signal?: AbortSignal) =>
  new Promise<void>(resolve => {
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    if (signal?.aborted) done();
    else signal?.addEventListener("abort", done, { once: true });
  });
