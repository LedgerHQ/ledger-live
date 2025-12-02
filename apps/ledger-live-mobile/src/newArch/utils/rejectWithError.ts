/**
 * Rejects a promise with the provided error.
 *
 * If the input is an instance of `Error`, it is directly used as the rejection reason.
 * Otherwise, the input is converted to a string and wrapped in a new `Error` instance.
 *
 * @param e - The error or value to reject the promise with.
 * @param extraData - Optional additional data to include in the error message.
 * @returns A promise that is rejected with the provided error or a new `Error` instance.
 */
export function rejectWithError({ e, extraData }: ErrorData): Promise<never> {
  const errorToReject = constructErrorMessage(e);
  return Promise.reject(errorToReject);
}

function constructErrorMessage(e: unknown): Error {
  const errorMessage = e instanceof Error ? e.message : String(e);
  const error = new Error(errorMessage);

  if (e instanceof Error) {
    error.name = e.name;
    error.stack = e.stack;
  }

  return error;
}

type ErrorData = {
  e: unknown;
  extraData?: Record<string, unknown>;
};
