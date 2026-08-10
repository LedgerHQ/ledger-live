import { createTimer } from "./timer";
import type { ReconnectionConfig } from "./types";

const BASE: Required<ReconnectionConfig> = {
  enabled: true,
  delay: 1000,
  factor: 2,
  maxDelay: 30000,
  maxAttempts: 3,
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("createTimer — disabled", () => {
  it("should return false for isRunning()", () => {
    const timer = createTimer({ ...BASE, enabled: false }, jest.fn());
    expect(timer.isRunning()).toBe(false);
  });

  it("should return 0 for getTime()", () => {
    const timer = createTimer({ ...BASE, enabled: false }, jest.fn());
    expect(timer.getTime()).toBe(0);
  });

  it("should not call func when start() is called and time advances", () => {
    const func = jest.fn();
    const timer = createTimer({ ...BASE, enabled: false }, func);
    timer.start();
    jest.runAllTimers();
    expect(func).not.toHaveBeenCalled();
  });

  it("should not throw when calling stop() and reset()", () => {
    const timer = createTimer({ ...BASE, enabled: false }, jest.fn());
    expect(() => {
      timer.stop();
      timer.reset();
    }).not.toThrow();
  });
});

describe("createTimer — getTime()", () => {
  it("should return delay * factor^1 as initial delay", () => {
    const timer = createTimer(BASE, jest.fn());
    expect(timer.getTime()).toBe(2000); // 1000 * 2^1
  });

  it("should cap the initial delay at maxDelay", () => {
    const timer = createTimer({ ...BASE, maxDelay: 500 }, jest.fn());
    expect(timer.getTime()).toBe(500);
  });

  it("should grow by factor after each invocation", () => {
    const timer = createTimer(BASE, jest.fn());
    const first = timer.getTime(); // 2000
    timer.start();
    jest.advanceTimersByTime(first);
    expect(timer.getTime()).toBe(first * BASE.factor); // 4000
  });

  it("should cap delay at maxDelay after enough invocations", () => {
    const timer = createTimer({ ...BASE, maxDelay: 2000 }, jest.fn());
    timer.start();
    jest.advanceTimersByTime(2000);
    expect(timer.getTime()).toBe(2000);
  });
});

describe("createTimer — start()", () => {
  it("should not call func before the delay elapses", () => {
    const func = jest.fn();
    const timer = createTimer(BASE, func);
    timer.start();
    jest.advanceTimersByTime(timer.getTime() - 1);
    expect(func).not.toHaveBeenCalled();
  });

  it("should call func after the delay elapses", () => {
    const func = jest.fn();
    const timer = createTimer(BASE, func);
    timer.start();
    jest.advanceTimersByTime(timer.getTime());
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should call func exactly maxAttempts times then stop", () => {
    const func = jest.fn();
    const timer = createTimer(BASE, func);
    timer.start();
    jest.runAllTimers();
    expect(func).toHaveBeenCalledTimes(BASE.maxAttempts);
  });

  it("should not call func after stop()", () => {
    const func = jest.fn();
    const timer = createTimer(BASE, func);
    timer.start();
    timer.stop();
    jest.runAllTimers();
    expect(func).not.toHaveBeenCalled();
  });
});

describe("createTimer — stop()", () => {
  it("should cancel a pending callback", () => {
    const func = jest.fn();
    const timer = createTimer(BASE, func);
    timer.start();
    timer.stop();
    jest.runAllTimers();
    expect(func).not.toHaveBeenCalled();
  });

  it("should not throw when not running", () => {
    const timer = createTimer(BASE, jest.fn());
    expect(() => timer.stop()).not.toThrow();
  });
});

describe("createTimer — reset()", () => {
  it("should reset the delay back to the initial value after growth", () => {
    const timer = createTimer(BASE, jest.fn());
    const initial = timer.getTime();
    timer.start();
    jest.advanceTimersByTime(initial); // fires once, delay grows
    timer.reset();
    expect(timer.getTime()).toBe(initial);
  });
});

describe("createTimer — isRunning()", () => {
  it("should return false before start() is called", () => {
    const timer = createTimer(BASE, jest.fn());
    expect(timer.isRunning()).toBe(false);
  });

  it("should return true after start() is called", () => {
    const timer = createTimer(BASE, jest.fn());
    timer.start();
    expect(timer.isRunning()).toBe(true);
  });

  it("should return false after stop() is called", () => {
    const timer = createTimer(BASE, jest.fn());
    timer.start();
    timer.stop();
    expect(timer.isRunning()).toBe(false);
  });
});
