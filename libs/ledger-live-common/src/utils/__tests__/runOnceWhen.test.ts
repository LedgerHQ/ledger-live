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

    expect(callback).toBeCalled();
    expect(conditionFunc).toBeCalled();
  });

  test("calls the callback function when the condition is fulfilled after < maxWaitTimeMS", () => {
    const conditionFunc = jest.fn(() => false);
    const callback = jest.fn();

    runOnceWhen(conditionFunc, callback, 5000);

    jest.advanceTimersByTime(100);

    expect(callback).not.toBeCalled();
    expect(conditionFunc).toBeCalled();

    conditionFunc.mockReturnValue(true);

    jest.advanceTimersByTime(100);

    expect(callback).toBeCalled();
    expect(conditionFunc).toBeCalled();
  });

  test("does not call the callback function when the condition is never fulfilled", () => {
    const conditionFunc = jest.fn(() => false);
    const callback = jest.fn();

    runOnceWhen(conditionFunc, callback, 5000);

    // Fast forward and exhaust only currently pending timers
    // (but not any new timers that get created during that process)
    jest.runOnlyPendingTimers();

    expect(callback).not.toBeCalled();
    expect(conditionFunc).toBeCalled();
  });

  test("stops checking after the maximum wait time has passed", () => {
    const conditionFunc = jest.fn(() => false);
    const callback = jest.fn();

    runOnceWhen(conditionFunc, callback, 5000);

    // Fast-forward until all timers have been executed
    jest.advanceTimersByTime(6000);

    conditionFunc.mockReturnValue(true);

    // Number of times conditionFunc gets called should be
    expect(conditionFunc).toHaveBeenCalledTimes(5000 / 100);

    expect(callback).not.toBeCalled();
  });
});
