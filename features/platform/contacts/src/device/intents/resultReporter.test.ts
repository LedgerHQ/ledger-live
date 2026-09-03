import { createContactIntentResultReporter, type ContactIntentResult } from "./resultReporter";

describe("createContactIntentResultReporter", () => {
  it("GIVEN nothing reported yet WHEN a result is reported THEN it forwards that result", () => {
    // GIVEN
    const onResult = jest.fn<void, [ContactIntentResult<string>]>();
    const reporter = createContactIntentResultReporter(onResult);

    // WHEN
    reporter.report({ type: "success", result: "proof" });

    // THEN
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ type: "success", result: "proof" });
  });

  it("GIVEN a reported success WHEN a later result is reported THEN it keeps the first as the only result", () => {
    // GIVEN
    const onResult = jest.fn<void, [ContactIntentResult<string>]>();
    const reporter = createContactIntentResultReporter(onResult);
    reporter.report({ type: "success", result: "proof" });

    // WHEN
    reporter.report({ type: "failure", error: new Error("late failure") });

    // THEN
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ type: "success", result: "proof" });
  });
});
