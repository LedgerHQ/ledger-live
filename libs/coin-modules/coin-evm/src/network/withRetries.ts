import { delay } from "@ledgerhq/live-promise";
import { isRateLimitRpcMethodError } from "./node/rpc.errors";
import { isHttpRateLimitError } from "./utils";

/**
 * Executes an async function and retries on rate limit
 *
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
    if (retries > 0 && (isHttpRateLimitError(e) || isRateLimitRpcMethodError(e))) {
      await delay(delayMs);
      return withRetries(fn, retries - 1, delayMs);
    }
    throw e;
  }
}
