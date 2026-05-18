import { isRetryableState, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Observable, defer, Subject, tap, repeat, EMPTY, take, finalize } from "rxjs";

/**
 * Runs an attempt and lets the user restart it when it ends in a recoverable state.
 *
 * Each attempt is an Observable built by `attemptFactory`. The factory receives a
 * `retry` callback that the attempt can expose to the user — typically by attaching
 * it to a state it emits, such as an error screen with a "Retry" button.
 *
 * Once an attempt completes:
 * - if its last emitted state is retryable, nothing happens until the user calls
 *   `retry()`; a fresh attempt then starts.
 * - otherwise, this observable completes too.
 *
 * Calling `retry()` more than once during the same attempt has no effect.
 *
 * @param attemptFactory - Builds a single attempt, given the `retry` callback it can
 *   offer to the user from any retryable state it emits.
 * @returns An observable that emits the states of successive attempts and completes
 *   once an attempt ends in a non-retryable state.
 */
export function withRetryableRepeat(
  attemptFactory: (retry: () => void) => Observable<EnsureAppReadyState>,
): Observable<EnsureAppReadyState> {
  return defer(() => {
    const retrySubject = new Subject<void>();
    let waitForRetry = false;

    const attempt$ = defer(() => {
      let retryCalledForAttempt = false;
      waitForRetry = false;

      const retry = () => {
        if (retryCalledForAttempt) {
          return;
        }

        retryCalledForAttempt = true;
        retrySubject.next();
      };

      return attemptFactory(retry);
    });

    return attempt$.pipe(
      tap(state => {
        waitForRetry = isRetryableState(state);
      }),
      repeat({
        delay: () => {
          if (!waitForRetry) {
            return EMPTY;
          }

          return retrySubject.pipe(take(1));
        },
      }),
      finalize(() => retrySubject.complete()),
    );
  });
}
