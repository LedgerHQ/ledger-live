const FREE_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const delayAfterFailures = (failures: number): number =>
  failures < FREE_ATTEMPTS
    ? 0
    : Math.min(BASE_DELAY_MS * 2 ** (failures - FREE_ATTEMPTS), MAX_DELAY_MS);

/**
 * Slows down password guessing against the account database through `setEncryptionKey` and
 * `isEncryptionKeyCorrect`. Attempts run one at a time, so firing them in parallel does not
 * skip the delay. A success resets the count.
 */
export function createKeyAttemptThrottle(wait: (ms: number) => Promise<void> = sleep) {
  let failures = 0;
  let last: Promise<unknown> = Promise.resolve();

  return <T>(attempt: () => Promise<T> | T, succeeded: (result: T) => boolean): Promise<T> => {
    const run = last
      .catch(() => undefined)
      .then(async () => {
        const ms = delayAfterFailures(failures);
        if (ms) await wait(ms);
        try {
          const result = await attempt();
          failures = succeeded(result) ? 0 : failures + 1;
          return result;
        } catch (error) {
          failures += 1;
          throw error;
        }
      });
    last = run;
    return run;
  };
}
