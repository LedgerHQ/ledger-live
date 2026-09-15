export type RetryPolicy = {
  attempts: number;
  delaysMs: number[];
  isRetryable(error: unknown): boolean;
};

export const defaultRetryAttempts = 3;
export const defaultRetryDelaysMs = [300, 900];

export function createRetryPolicy(isRetryable: (error: unknown) => boolean): RetryPolicy {
  return {
    attempts: defaultRetryAttempts,
    delaysMs: [...defaultRetryDelaysMs],
    isRetryable,
  };
}

export type RetryOptions = {
  /**
   * Consulted after each delay: an actor stopped during a backoff must not reach the device again.
   */
  isCancelled?: () => boolean;
};

/** Only the failure of the last attempt is thrown, so a transient error never reaches the machine. */
export async function withRetries<T>(
  run: () => Promise<T>,
  policy: RetryPolicy,
  { isCancelled }: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, policy.attempts);

  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const isLastAttempt = attempt >= attempts;

      if (isLastAttempt || !policy.isRetryable(error)) {
        throw error;
      }

      await delay(delayForAttempt(policy.delaysMs, attempt));

      if (isCancelled?.()) {
        throw error;
      }
    }
  }
}

function delayForAttempt(delaysMs: number[], attempt: number): number {
  return delaysMs[attempt - 1] ?? delaysMs.at(-1) ?? 0;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
