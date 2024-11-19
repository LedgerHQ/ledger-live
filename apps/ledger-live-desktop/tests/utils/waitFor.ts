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
        clearInterval(interval as unknown as number);
        resolve(true);
      }
    }, intervalMs);

    setTimeout(() => {
      clearInterval(interval as unknown as number);
      reject(new Error("waitFor timeout"));
    }, timeout);
  });
}

export async function waitForTimeOut(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
