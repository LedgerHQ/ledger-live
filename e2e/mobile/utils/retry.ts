export async function retryUntilTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeout = 60_000,
  interval = 500,
  options: { cancellable?: boolean } = {},
): Promise<T> {
  const cancellable = options.cancellable ?? false;
  const start = Date.now();
  const deadline = start + timeout;
  let lastError: unknown;

  while (Date.now() < deadline) {
    const controller = new AbortController();

    try {
      return cancellable
        ? await runCancellableAttempt(fn, controller, deadline, timeout)
        : await fn(controller.signal);
    } catch (err) {
      lastError = err;
      controller.abort();
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise(res => setTimeout(res, Math.min(interval, remaining)));
  }

  const errMsg =
    lastError instanceof Error
      ? lastError.message
      : typeof lastError === "string"
        ? lastError
        : JSON.stringify(lastError);

  throw new Error(
    [`❌ [retryUntilTimeout] Timed out after ${timeout}ms`, `🧪 ${errMsg}`].join("\n"),
  );
}

/**
 * Races fn() against the remaining deadline instead of awaiting it directly, so one stuck
 * attempt can't block the retry loop past its stated timeout. The abandoned attempt (if any)
 * is left with a no-op catch so its eventual settlement can't surface as an unhandled
 * rejection later, during teardown or the next attempt.
 */
async function runCancellableAttempt<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  controller: AbortController,
  deadline: number,
  timeout: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const attempt = Promise.resolve().then(() => fn(controller.signal));
  attempt.catch(() => {});

  try {
    return await Promise.race([
      attempt,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`retryUntilTimeout: attempt exceeded the ${timeout}ms budget`)),
          deadline - Date.now(),
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
