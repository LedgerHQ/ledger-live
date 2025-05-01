import * as Sentry from "@sentry/react-native";

/**
 * Adds extra data to a Sentry error and captures the exception.
 *
 * @param e - The error to be captured.
 * @param extraData - An object containing additional data to be added to the error.
 */
export function captureExceptionWithExtraData(
  e: unknown,
  extraData: Record<string, unknown> | undefined,
): void {
  Sentry.withScope(scope => {
    if (extraData) {
      Object.entries(extraData).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(e);
  });
}
