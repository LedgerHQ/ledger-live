import { useCallback, useState } from "react";

/**
 * Tracks a user-triggered retry of a failed attempt. `useBridgeTransaction` never settles a failed
 * preparation (`bridgePending` stays true while it retries on its own), so `bridgePending` can't
 * tell a failure apart from a retry in flight: the retry is in flight for as long as the error it
 * was pressed on is still the current one, and ends once that error clears or is replaced.
 */
export function useRetry(error: Error | null | undefined, onRetry: () => void) {
  const [retriedError, setRetriedError] = useState<Error | null>(null);
  const retrying = !!error && retriedError === error;

  const retry = useCallback(() => {
    setRetriedError(error ?? null);
    onRetry();
  }, [error, onRetry]);

  return { retrying, retry };
}
