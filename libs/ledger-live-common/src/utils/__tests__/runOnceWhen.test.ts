import { runOnceWhen } from "../runOnceWhen";

describe("runOnceWhen function", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  test("calls the callback function when the condition is fulfilled", () => {
    const conditionFunc = jest.fn(() => true);
    const callback = jest.fn();

    runOnceWhen(conditionFunc, callback, 5000);

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalled();
    expect(conditionFunc).toHaveBeenCalled();
  });

  test("calls the callback function when the condition is fulfilled after < maxWaitTimeMS", () => {
    const conditionFunc = jest.fn(() => false);
    const callback = jest.fn();

    runOnceWhen(conditionFunc, callback, 5000);

    jest.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
    expect(conditionFunc).toHaveBeenCalled();

    conditionFunc.mockReturnValue(true);

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalled();
    expect(conditionFunc).toHaveBeenCalled();
  });

  test("does not call the callback function when the condition is never fulfilled", () => {
    const conditionFunc = jest.fn(() => false);
    const callback = jest.fn();

    runOnceWhen(conditionFunc, callback, 5000);

    // Fast forward and exhaust only currently pending timers
    // (but not any new timers that get created during that process)
    jest.runOnlyPendingTimers();

    expect(callback).not.toHaveBeenCalled();
    expect(conditionFunc).toHaveBeenCalled();
  });

  test("stops checking after the maximum wait time has passed", () => {
    const conditionFunc = jest.fn(() => false);
    const callback = jest.fn();

    runOnceWhen(conditionFunc, callback, 5000);

    // Advance past maxWaitTimeMS so the timeout clears the interval.
    jest.advanceTimersByTime(5001);
    const callsAtCutoff = conditionFunc.mock.calls.length;

    // Even if the condition becomes true, no further checks should happen.
    conditionFunc.mockReturnValue(true);
    jest.advanceTimersByTime(500);

    expect(conditionFunc).toHaveBeenCalledTimes(callsAtCutoff);
    expect(callback).not.toHaveBeenCalled();
  });
});
