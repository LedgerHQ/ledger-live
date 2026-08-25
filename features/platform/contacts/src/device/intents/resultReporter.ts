import { finalize, tap, type MonoTypeOperatorFunction } from "rxjs";
import { ContactDeviceIntentCancelledError } from "../errors";

export type ContactIntentResult<Value> =
  | { readonly type: "success"; readonly result: Value }
  | { readonly type: "failure"; readonly error: Error };

/**
 * Reports one terminal intent result so consumers awaiting `onResult` always settle.
 * An unsubscribe before normal completion is reported as a cancellation failure.
 */
export function createContactIntentResultReporter<Value>(
  onResult: (result: ContactIntentResult<Value>) => void,
): Readonly<{
  report: (result: ContactIntentResult<Value>) => void;
  cancelOnUnsubscribe: <JobState>() => MonoTypeOperatorFunction<JobState>;
}> {
  let hasReported = false;

  const report = (result: ContactIntentResult<Value>) => {
    if (hasReported) {
      return;
    }
    hasReported = true;
    onResult(result);
  };

  const cancelIfPending = () => {
    report({ type: "failure", error: new ContactDeviceIntentCancelledError() });
  };

  return {
    report,
    cancelOnUnsubscribe:
      <JobState>() =>
      source => {
        let hasTerminated = false;
        return source.pipe(
          tap({
            complete: () => {
              hasTerminated = true;
            },
            error: () => {
              hasTerminated = true;
            },
          }),
          finalize(() => {
            if (!hasTerminated) {
              cancelIfPending();
            }
          }),
        );
      },
  };
}
