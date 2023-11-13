/**
 * Returns a promise that resolves when the `predicate` function resolves to true.
 * If the `predicate` function resolves to false, it tries again after
 * `intervalMs` milliseconds.
 * It times out and throws an error after `timeout` milliseconds
 */
export async function waitFor(
  predicate: () => Promise<boolean>,
  intervalMs = 200,
  timeout = 30000,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const condition = await predicate();
      if (condition) {
        // @ts-expect-error web vs node Timers
        clearInterval(interval);
        resolve(true);
      }
    }, intervalMs);

    setTimeout(() => {
      // @ts-expect-error web vs node Timers
      clearInterval(interval);
      reject(new Error("waitFor timeout"));
    }, timeout);
  });
}
