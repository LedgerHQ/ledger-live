export type ContactIntentResult<Value> =
  | { readonly type: "success"; readonly result: Value }
  | { readonly type: "failure"; readonly error: Error };

/**
 * Reports at most one terminal intent result per job run.
 *
 * A teardown before the job reports settles nothing: the executor tears jobs down
 * whenever it leaves intent execution and keeps the operation alive, so a later run
 * can still report. Dismissal is what settles the flow's promise.
 */
export function createContactIntentResultReporter<Value>(
  onResult: (result: ContactIntentResult<Value>) => void,
): Readonly<{
  report: (result: ContactIntentResult<Value>) => void;
}> {
  let hasReported = false;

  return {
    report: (result: ContactIntentResult<Value>) => {
      if (hasReported) {
        return;
      }
      hasReported = true;
      onResult(result);
    },
  };
}
