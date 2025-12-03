/**
 * @jest-environment jsdom
 */

// Mock the bridge to avoid loading all bridge implementations with ESM dependencies
jest.mock("../../bridge", () => ({
  getCurrencyBridge: jest.fn(),
}));

import { renderHook, act } from "@testing-library/react";
import { getRemainingTime, useTimeRemaining } from "./react";

const MILLISECOND = 1000;
const SECOND = 1 * MILLISECOND;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("getRemainingTime", () => {
  test("should return empty string for negative or zero diff", () => {
    expect(getRemainingTime(0)).toBe("");
    expect(getRemainingTime(-1000)).toBe("");
    expect(getRemainingTime(-100000)).toBe("");
  });

  test("should format seconds only", () => {
    expect(getRemainingTime(30 * SECOND)).toBe("30s");
    expect(getRemainingTime(59 * SECOND)).toBe("59s");
    expect(getRemainingTime(1 * SECOND)).toBe("1s");
  });

  test("should format minutes and seconds", () => {
    expect(getRemainingTime(1 * MINUTE + 30 * SECOND)).toBe("1m 30s");
    expect(getRemainingTime(5 * MINUTE + 15 * SECOND)).toBe("5m 15s");
    expect(getRemainingTime(59 * MINUTE + 59 * SECOND)).toBe("59m 59s");
  });

  test("should format hours, minutes and seconds", () => {
    expect(getRemainingTime(1 * HOUR + 30 * MINUTE + 15 * SECOND)).toBe("1h 30m 15s");
    expect(getRemainingTime(2 * HOUR + 5 * MINUTE + 10 * SECOND)).toBe("2h 5m 10s");
    expect(getRemainingTime(23 * HOUR + 59 * MINUTE + 59 * SECOND)).toBe("23h 59m 59s");
  });

  test("should format days, hours, minutes and seconds", () => {
    expect(getRemainingTime(1 * DAY + 2 * HOUR + 30 * MINUTE + 15 * SECOND)).toBe("1d 2h 30m 15s");
    expect(getRemainingTime(5 * DAY + 10 * HOUR + 5 * MINUTE + 10 * SECOND)).toBe("5d 10h 5m 10s");
    expect(getRemainingTime(10 * DAY + 23 * HOUR + 59 * MINUTE + 59 * SECOND)).toBe(
      "10d 23h 59m 59s",
    );
  });

  test("should skip zero values", () => {
    expect(getRemainingTime(1 * DAY)).toBe("1d 0s");
    expect(getRemainingTime(1 * HOUR)).toBe("1h 0s");
    expect(getRemainingTime(1 * MINUTE)).toBe("1m 0s");
    expect(getRemainingTime(1 * DAY + 1 * MINUTE)).toBe("1d 1m 0s");
    expect(getRemainingTime(1 * DAY + 1 * HOUR)).toBe("1d 1h 0s");
  });
});

describe("useTimeRemaining", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  test("should return empty string when proposal is null", () => {
    const { result } = renderHook(() => useTimeRemaining());
    expect(result.current).toBe("");
  });

  test("should return empty string when proposal is expired", () => {
    const proposal = {
      expiresAt: (Date.now() - 1000) * 1000, // 1 second ago
      isExpired: true,
    };
    const { result } = renderHook(() => useTimeRemaining(proposal.expiresAt, proposal.isExpired));
    expect(result.current).toBe("");
  });

  test("should return formatted time remaining for valid proposal", () => {
    const expiresAt = Date.now() + 2 * HOUR + 30 * MINUTE + 15 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));
    expect(result.current).toBe("2h 30m 15s");
  });

  test("should update time remaining every second", () => {
    const expiresAt = Date.now() + 2 * MINUTE + 30 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current).toBe("2m 30s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toBe("2m 29s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toBe("2m 28s");

    act(() => {
      jest.advanceTimersByTime(30 * SECOND);
    });
    expect(result.current).toBe("1m 58s");
  });

  test("should return empty string when time expires", () => {
    const expiresAt = Date.now() + 2 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current).toBe("2s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toBe("1s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toBe("");
  });

  test("should clear interval on unmount", () => {
    const expiresAt = Date.now() + 1 * HOUR;
    const { result, unmount } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current).toBe("1h 0s");

    unmount();

    // Advance time after unmount - should not cause errors
    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
  });
});
