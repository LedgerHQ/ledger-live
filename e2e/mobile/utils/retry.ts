export async function retryUntilTimeout<T>(
  fn: () => Promise<T>,
  timeout = 60_000,
  interval = 500,
): Promise<T> {
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeout) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise(res => setTimeout(res, interval));
    }
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
