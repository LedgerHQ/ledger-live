/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { getRemainingTime, useTimeRemaining, formatDate } from "./utils";

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

describe("formatDate", () => {
  test("should format timestamp correctly", () => {
    // January 1, 2024 12:30:45 UTC (in microseconds)
    const timestamp = 1704112245000 * 1000;
    const formatted = formatDate(timestamp);
    const date = new Date(timestamp / 1000);
    const expectedDate = date.toISOString().split("T")[0];
    const expectedTime = date.toTimeString().split(" ")[0].substring(0, 5);
    expect(formatted).toBe(`${expectedDate} ${expectedTime}`);
  });

  test("should format timestamp at midnight", () => {
    // January 1, 2024 00:00:00 UTC (in microseconds)
    const timestamp = 1704067200000 * 1000;
    const formatted = formatDate(timestamp);
    const date = new Date(timestamp / 1000);
    const expectedDate = date.toISOString().split("T")[0];
    const expectedTime = date.toTimeString().split(" ")[0].substring(0, 5);
    expect(formatted).toBe(`${expectedDate} ${expectedTime}`);
  });

  test("should format timestamp at end of day", () => {
    // January 1, 2024 23:59:59 UTC (in microseconds)
    const timestamp = 1704153599000 * 1000;
    const formatted = formatDate(timestamp);
    const date = new Date(timestamp / 1000);
    const expectedDate = date.toISOString().split("T")[0];
    const expectedTime = date.toTimeString().split(" ")[0].substring(0, 5);
    expect(formatted).toBe(`${expectedDate} ${expectedTime}`);
  });

  test("should handle single digit hours and minutes", () => {
    // January 1, 2024 05:05:05 UTC (in microseconds)
    const timestamp = 1704092705000 * 1000;
    const formatted = formatDate(timestamp);
    const date = new Date(timestamp / 1000);
    const expectedDate = date.toISOString().split("T")[0];
    const expectedTime = date.toTimeString().split(" ")[0].substring(0, 5);
    expect(formatted).toBe(`${expectedDate} ${expectedTime}`);
  });

  test("should format different dates correctly", () => {
    // December 31, 2023 15:30:00 UTC (in microseconds)
    const timestamp1 = 1704034200000 * 1000;
    const date1 = new Date(timestamp1 / 1000);
    const expectedDate1 = date1.toISOString().split("T")[0];
    const expectedTime1 = date1.toTimeString().split(" ")[0].substring(0, 5);
    expect(formatDate(timestamp1)).toBe(`${expectedDate1} ${expectedTime1}`);

    // February 29, 2024 10:15:30 UTC (leap year, in microseconds)
    const timestamp2 = 1709201730000 * 1000;
    const date2 = new Date(timestamp2 / 1000);
    const expectedDate2 = date2.toISOString().split("T")[0];
    const expectedTime2 = date2.toTimeString().split(" ")[0].substring(0, 5);
    expect(formatDate(timestamp2)).toBe(`${expectedDate2} ${expectedTime2}`);
  });

  test("should use UTC date and local time format", () => {
    // Test that the function uses UTC for date and local time for time portion
    const timestamp = 1704112245000 * 1000; // January 1, 2024 12:30:45 UTC
    const formatted = formatDate(timestamp);
    const date = new Date(timestamp / 1000);

    // Date part should be UTC
    const utcDate = date.toISOString().split("T")[0];
    expect(formatted).toContain(utcDate);

    // Time part should be local time in HH:MM format (no seconds)
    const localTime = date.toTimeString().split(" ")[0].substring(0, 5);
    expect(formatted).toContain(localTime);
    expect(formatted.split(" ")[1]).toMatch(/^\d{2}:\d{2}$/); // HH:MM format
  });
});
