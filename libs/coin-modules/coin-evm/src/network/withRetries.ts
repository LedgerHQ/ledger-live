import { delay } from "@ledgerhq/live-promise";

/**
 * Executes an async function and retries on failure.
 * @param fn - The async function to execute
 * @param retries - Number of retries on failure (0 = no retries)
 * @param delayMs - Delay in ms between retries
 * @returns The result of fn()
 */
export async function withRetries<T>(
  fn: () => Promise<T>,
  retries: number,
  delayMs: number,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries > 0) {
      await delay(delayMs);
      return withRetries(fn, retries - 1, delayMs);
    }
    throw e;
  }
}
