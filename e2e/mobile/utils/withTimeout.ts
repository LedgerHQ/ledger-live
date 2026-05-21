import { log } from "detox";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

/**
 * Race a promise against a timeout. Timeouts always warn-and-resolve-`undefined`;
 * rejection swallowing is opt-out via `rethrow: true` for teardown ops that
 * should fail loud.
 *
 * `Promise.race` cannot cancel: if the underlying operation settles after the
 * timeout, a "late side effects possible" warning is logged. Any late rejection
 * is silenced so it doesn't surface as an `unhandledRejection`.
 *
 * @param promise   The operation to bound.
 * @param timeoutMs Timeout budget in milliseconds.
 * @param label     Identifier used in warning logs.
 * @param options.rethrow When `true`, rejections propagate to the caller
 *                  instead of being swallowed. Timeouts are always swallowed.
 * @returns The resolved value, or `undefined` on timeout / swallowed rejection.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
  options: { rethrow?: boolean } = {},
): Promise<T | undefined> {
  let timedOut = false;
  promise.then(
    () => {
      if (timedOut) log.warn(`${label} completed after timeout — late side effects possible`);
    },
    err => {
      if (timedOut) log.warn(`${label} rejected after timeout: ${sanitizeError(err)}`);
    },
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>(resolve => {
    timer = setTimeout(() => {
      timedOut = true;
      log.warn(`${label} timed out after ${timeoutMs}ms; skipping`);
      resolve(undefined);
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } catch (err) {
    if (options.rethrow) throw err;
    log.warn(`${label} failed: ${sanitizeError(err)}`);
    return undefined;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
