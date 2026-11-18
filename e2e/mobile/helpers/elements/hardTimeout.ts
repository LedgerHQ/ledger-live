import { log } from "detox";
import { TIMEOUT } from "@e2e/utils/timeouts";

const HARD_TIMEOUT_MARKER = "possible bridge hang";
const CONCURRENT_INTERACTION_MARKER = "multiple interactions taking place";

/** Errors from the Jest test sandbox are not `instanceof Error` in the test environment. */
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** True when the error is a hard timeout: the app never answered, as opposed to a failed check. */
export const isHardTimeout = (error: unknown): boolean =>
  errorMessage(error).includes(HARD_TIMEOUT_MARKER);

/**
 * True when a Detox request was abandoned or rejected before the app answered it, so the check
 * it carried never ran. Detox keeps such a request in flight and rejects every later atomic one.
 */
export function isUnansweredDetoxRequestError(error: unknown): boolean {
  const message = errorMessage(error);
  return message.includes(HARD_TIMEOUT_MARKER) || message.includes(CONCURRENT_INTERACTION_MARKER);
}

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
