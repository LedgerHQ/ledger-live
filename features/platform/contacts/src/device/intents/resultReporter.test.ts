import { NEVER, of, throwError } from "rxjs";
import { ContactDeviceIntentCancelledError } from "../../contactDeviceIntentsPort";
import { createContactIntentResultReporter, type ContactIntentResult } from "./resultReporter";

describe("createContactIntentResultReporter", () => {
  it("GIVEN a reported success WHEN the observable finalizes THEN it keeps the success as the only result", () => {
    // GIVEN
    const onResult = jest.fn<void, [ContactIntentResult<string>]>();
    const reporter = createContactIntentResultReporter(onResult);
    reporter.report({ type: "success", result: "proof" });

    // WHEN
    of(undefined).pipe(reporter.cancelOnUnsubscribe()).subscribe();

    // THEN
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ type: "success", result: "proof" });
  });

  it("GIVEN no reported result WHEN the observable is unsubscribed THEN it reports cancellation", () => {
    // GIVEN
    const onResult = jest.fn<void, [ContactIntentResult<string>]>();
    const reporter = createContactIntentResultReporter(onResult);
    const subscription = NEVER.pipe(reporter.cancelOnUnsubscribe()).subscribe();

    // WHEN
    subscription.unsubscribe();

    // THEN
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0]?.[0]).toEqual({
      type: "failure",
      error: expect.any(ContactDeviceIntentCancelledError),
    });
  });

  it("GIVEN no reported result WHEN the observable completes THEN it leaves missing-result handling to the orchestrator", () => {
    // GIVEN
    const onResult = jest.fn<void, [ContactIntentResult<string>]>();
    const reporter = createContactIntentResultReporter(onResult);

    // WHEN
    of(undefined).pipe(reporter.cancelOnUnsubscribe()).subscribe();

    // THEN
    expect(onResult).not.toHaveBeenCalled();
  });

  it("GIVEN no reported result WHEN the observable errors THEN it leaves fallback handling to the executor", () => {
    // GIVEN
    const onResult = jest.fn<void, [ContactIntentResult<string>]>();
    const reporter = createContactIntentResultReporter(onResult);
    const error = new Error("unexpected error");

    // WHEN
    throwError(() => error)
      .pipe(reporter.cancelOnUnsubscribe())
      .subscribe({ error: () => undefined });

    // THEN
    expect(onResult).not.toHaveBeenCalled();
  });
});
