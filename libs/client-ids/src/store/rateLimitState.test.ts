import { getLastFailureTime, setLastFailureTime, clearLastFailureTime } from "./rateLimitState";

describe("rateLimitState", () => {
  beforeEach(() => {
    // Reset state before each test
    clearLastFailureTime();
  });

  it("should return undefined initially", () => {
    expect(getLastFailureTime()).toBeUndefined();
  });

  it("should set and get last failure time", () => {
    const time = Date.now();
    setLastFailureTime(time);
    expect(getLastFailureTime()).toBe(time);
  });

  it("should clear last failure time", () => {
    const time = Date.now();
    setLastFailureTime(time);
    expect(getLastFailureTime()).toBe(time);

    clearLastFailureTime();
    expect(getLastFailureTime()).toBeUndefined();
  });

  it("should update last failure time", () => {
    const time1 = Date.now();
    const time2 = time1 + 1000;

    setLastFailureTime(time1);
    expect(getLastFailureTime()).toBe(time1);

    setLastFailureTime(time2);
    expect(getLastFailureTime()).toBe(time2);
  });
});
