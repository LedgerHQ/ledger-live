const FREE_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const delayAfterFailures = (failures: number): number =>
  failures < FREE_ATTEMPTS
    ? 0
    : Math.min(BASE_DELAY_MS * 2 ** (failures - FREE_ATTEMPTS), MAX_DELAY_MS);

/** "unchecked": no password was checked, so the count neither grows nor resets. */
export type KeyAttemptOutcome = "correct" | "wrong" | "unchecked";

/** Attempts run one at a time, so parallel calls cannot skip the delay. */
export function createKeyAttemptThrottle(wait: (ms: number) => Promise<void> = sleep) {
  let failures = 0;
  let last: Promise<unknown> = Promise.resolve();

  return <T>(
    attempt: () => Promise<T> | T,
    outcome: (result: T) => KeyAttemptOutcome,
  ): Promise<T> => {
    const run = last
      .catch(() => undefined)
      .then(async () => {
        const ms = delayAfterFailures(failures);
        if (ms) await wait(ms);
        try {
          const result = await attempt();
          const checked = outcome(result);
          if (checked === "correct") failures = 0;
          else if (checked === "wrong") failures += 1;
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
