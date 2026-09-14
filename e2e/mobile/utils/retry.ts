export async function retryUntilTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeout = 60_000,
  interval = 500,
): Promise<T> {
  const start = Date.now();
  const deadline = start + timeout;
  let lastError: unknown;

  while (Date.now() < deadline) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Timed-out attempt may keep running and mutate app state later.
    // Signal lets callers that support it stop early to prevent an unhandled rejection.
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
    } catch (err) {
      lastError = err;
      controller.abort();
    } finally {
      clearTimeout(timer);
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
