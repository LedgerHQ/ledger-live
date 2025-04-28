export async function retryUntilTimeout<T>(
  fn: () => Promise<T>,
  timeout = 60_000,
  interval = 200,
): Promise<T> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      return await fn();
    } catch (err) {
      await new Promise(res => setTimeout(res, interval));
    }
  }

  throw new Error(
    `[retryUntilTimeout] ❌ Timeout (${timeout}ms) exceeded while waiting for condition`,
  );
}
