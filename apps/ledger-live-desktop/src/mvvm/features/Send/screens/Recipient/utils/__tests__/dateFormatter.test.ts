import { normalizeLastUsedTimestamp, formatRelativeDate } from "../dateFormatter";

describe("dateFormatter utils", () => {
  describe("normalizeLastUsedTimestamp", () => {
    it("converts seconds to milliseconds for legacy timestamps", () => {
      const timestampInSeconds = 1609459200; // Jan 1, 2021 in seconds
      const result = normalizeLastUsedTimestamp(timestampInSeconds);

      expect(result).toBe(1609459200000);
    });

    it("keeps milliseconds timestamps as is", () => {
      const timestampInMs = 1609459200000; // Jan 1, 2021 in milliseconds
      const result = normalizeLastUsedTimestamp(timestampInMs);

      expect(result).toBe(1609459200000);
    });

    it("returns current time for undefined", () => {
      const before = Date.now();
      const result = normalizeLastUsedTimestamp(undefined);
      const after = Date.now();

      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });

    it("returns current time for invalid timestamps", () => {
      const before = Date.now();
      const result = normalizeLastUsedTimestamp(0);
      const after = Date.now();

      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });

    it("returns current time for negative timestamps", () => {
      const before = Date.now();
      const result = normalizeLastUsedTimestamp(-100);
      const after = Date.now();

      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe("formatRelativeDate", () => {
    const MINUTE_MS = 60 * 1000;
    const HOUR_MS = 60 * MINUTE_MS;
    const DAY_MS = 24 * HOUR_MS;
    const WEEK_MS = 7 * DAY_MS;

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('returns "just now" for dates in the future', () => {
      const futureDate = new Date("2024-01-15T13:00:00.000Z");
      expect(formatRelativeDate(futureDate)).toBe("just now");
    });

    it('returns "just now" for current time', () => {
      const now = new Date("2024-01-15T12:00:00.000Z");
      expect(formatRelativeDate(now)).toBe("just now");
    });

    it("returns minutes ago for recent times", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * MINUTE_MS);
      expect(formatRelativeDate(fiveMinutesAgo)).toBe("5 min ago");
    });

    it("returns 1 min ago for less than a minute", () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      expect(formatRelativeDate(thirtySecondsAgo)).toBe("1 min ago");
    });

    it("returns hours ago for times within the same day", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * HOUR_MS);
      expect(formatRelativeDate(twoHoursAgo)).toBe("2 hours ago");
    });

    it("returns hour ago (singular) for one hour", () => {
      const oneHourAgo = new Date(Date.now() - HOUR_MS);
      expect(formatRelativeDate(oneHourAgo)).toBe("1 hour ago");
    });

    it("returns days ago for times within a week", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * DAY_MS);
      expect(formatRelativeDate(threeDaysAgo)).toBe("3 days ago");
    });

    it("returns day ago (singular) for one day", () => {
      const oneDayAgo = new Date(Date.now() - DAY_MS);
      expect(formatRelativeDate(oneDayAgo)).toBe("1 day ago");
    });

    it("returns date format for times older than a week in the same year", () => {
      const twoWeeksAgo = new Date(Date.now() - 2 * WEEK_MS);
      const result = formatRelativeDate(twoWeeksAgo);

      // Intl.DateTimeFormat order varies by locale (e.g. "1 Jan" vs "Jan 1")
      expect(result).toMatch(/\d{1,2}/);
      expect(result).toMatch(/Jan/);
      expect(result).not.toMatch(/\d{2}$/);
    });

    it("returns date format with year for dates in previous years", () => {
      const lastYear = new Date("2023-01-01T12:00:00.000Z");
      const result = formatRelativeDate(lastYear);

      expect(result).toMatch(/1|01/);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/23/);
    });

    it("returns empty string for invalid dates", () => {
      const invalidDate = new Date("invalid");
      expect(formatRelativeDate(invalidDate)).toBe("");
    });

    it("handles dates at year boundaries correctly", () => {
      const lastDayOfYear = new Date("2023-12-31T12:00:00.000Z");
      const result = formatRelativeDate(lastDayOfYear);

      expect(result).toMatch(/31/);
      expect(result).toMatch(/Dec/);
      expect(result).toMatch(/23/);
    });

    it("uses i18n t() when provided", () => {
      const now = new Date("2024-01-15T12:00:00.000Z");
      const mockT = (key: string, opts?: { count?: number }) => {
        if (key === "newSendFlow.relativeDate.justNow") return "À l'instant";
        if (key === "newSendFlow.relativeDate.minutesAgo") return `${opts?.count ?? 0} min ago`;
        return key;
      };
      expect(formatRelativeDate(now, { t: mockT, locale: "fr" })).toBe("À l'instant");

      const fiveMinAgo = new Date(Date.now() - 5 * MINUTE_MS);
      expect(formatRelativeDate(fiveMinAgo, { t: mockT, locale: "fr" })).toBe("5 min ago");
    });
  });
});
