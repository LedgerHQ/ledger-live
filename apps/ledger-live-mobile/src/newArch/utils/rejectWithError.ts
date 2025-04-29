/**
 * Rejects a promise with the provided error.
 *
 * If the input is an instance of `Error`, it is directly used as the rejection reason.
 * Otherwise, the input is converted to a string and wrapped in a new `Error` instance.
 *
 * @param e - The error or value to reject the promise with.
 * @returns A promise that is rejected with the provided error or a new `Error` instance.
 */
export function rejectWithError(e: unknown): Promise<never> {
  return Promise.reject(e instanceof Error ? e : new Error(String(e)));
}
