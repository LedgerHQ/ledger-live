import { log } from "detox";
import { TIMEOUT } from "@e2e/utils/timeouts";

// Same text as in elementHelpers.ts: jest.environment.ts detects a hung Detox request by it.
const HARD_TIMEOUT_MARKER = "possible bridge hang";
const CONCURRENT_INTERACTION_MARKER = "multiple interactions taking place";

/** A wait answers by itself at its own timeout, so the hard timeout must outlast it. */
export const waitHardTimeout = (timeout: number) =>
  Math.max(TIMEOUT.xxxlarge, timeout + TIMEOUT.xlarge);

/**
 * Bounds a single Detox action so a stuck bridge call fails the step instead of the whole test.
 * Never retries: a Detox action cannot be cancelled, so a retry could tap twice.
 */
export async function withHardTimeout<T>(
  actionPromise: Promise<T>,
  timeoutMs = TIMEOUT.xxxlarge,
): Promise<T> {
  // The abandoned action may still settle later; without this its rejection would be unhandled.
  actionPromise.catch(() => {});

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      actionPromise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(`Detox action timed out after ${timeoutMs}ms (${HARD_TIMEOUT_MARKER})`),
            ),
          timeoutMs,
        );
      }),
    ]);
  } catch (err) {
    if (err instanceof Error && err.message.includes(CONCURRENT_INTERACTION_MARKER)) {
      log.warn(
        `${err.message}\nMay be caused by an earlier abandoned timeout - check for a preceding "${HARD_TIMEOUT_MARKER}" warning.`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
