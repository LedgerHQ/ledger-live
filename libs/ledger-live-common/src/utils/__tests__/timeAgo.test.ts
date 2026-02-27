import { formatTimeAgo, SECOND_MS, MINUTE_MS, HOUR_MS, DAY_MS } from "../timeAgo";

const NOW = new Date("2025-08-15T12:00:00Z").getTime();
const LOCALE = "en";

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "always" });

describe("formatTimeAgo", () => {
  describe("seconds (< 1 minute)", () => {
    it("should format 0 seconds ago", () => {
      expect(formatTimeAgo(NOW, LOCALE, NOW)).toBe(rtf.format(-0, "second"));
    });

    it("should format 30 seconds ago", () => {
      expect(formatTimeAgo(NOW - 30 * SECOND_MS, LOCALE, NOW)).toBe(rtf.format(-30, "second"));
    });

    it("should format 59 seconds ago", () => {
      expect(formatTimeAgo(NOW - 59 * SECOND_MS, LOCALE, NOW)).toBe(rtf.format(-59, "second"));
    });
  });

  describe("minutes (< 1 hour)", () => {
    it("should format 1 minute ago", () => {
      expect(formatTimeAgo(NOW - MINUTE_MS, LOCALE, NOW)).toBe(rtf.format(-1, "minute"));
    });

    it("should format 3 minutes ago", () => {
      expect(formatTimeAgo(NOW - 3 * MINUTE_MS, LOCALE, NOW)).toBe(rtf.format(-3, "minute"));
    });

    it("should format 59 minutes ago", () => {
      expect(formatTimeAgo(NOW - 59 * MINUTE_MS, LOCALE, NOW)).toBe(rtf.format(-59, "minute"));
    });

    it("should floor partial minutes", () => {
      expect(formatTimeAgo(NOW - (3 * MINUTE_MS + 45 * SECOND_MS), LOCALE, NOW)).toBe(
        rtf.format(-3, "minute"),
      );
    });
  });

  describe("hours (< 1 day)", () => {
    it("should format 1 hour ago", () => {
      expect(formatTimeAgo(NOW - HOUR_MS, LOCALE, NOW)).toBe(rtf.format(-1, "hour"));
    });

    it("should format 2 hours ago", () => {
      expect(formatTimeAgo(NOW - 2 * HOUR_MS, LOCALE, NOW)).toBe(rtf.format(-2, "hour"));
    });

    it("should format 23 hours ago", () => {
      expect(formatTimeAgo(NOW - 23 * HOUR_MS, LOCALE, NOW)).toBe(rtf.format(-23, "hour"));
    });

    it("should floor partial hours", () => {
      expect(formatTimeAgo(NOW - (2 * HOUR_MS + 45 * MINUTE_MS), LOCALE, NOW)).toBe(
        rtf.format(-2, "hour"),
      );
    });
  });

  describe("days (< 7 days)", () => {
    it("should format 1 day ago", () => {
      expect(formatTimeAgo(NOW - DAY_MS, LOCALE, NOW)).toBe(rtf.format(-1, "day"));
    });

    it("should format 6 days ago", () => {
      expect(formatTimeAgo(NOW - 6 * DAY_MS, LOCALE, NOW)).toBe(rtf.format(-6, "day"));
    });

    it("should floor partial days", () => {
      expect(formatTimeAgo(NOW - (3 * DAY_MS + 12 * HOUR_MS), LOCALE, NOW)).toBe(
        rtf.format(-3, "day"),
      );
    });
  });

  describe("absolute date same year (>= 7 days)", () => {
    it("should format a date in the same year without year", () => {
      const timestamp = new Date("2025-01-12T12:00:00Z").getTime();
      const expected = new Intl.DateTimeFormat(LOCALE, {
        day: "numeric",
        month: "short",
      }).format(new Date(timestamp));
      expect(formatTimeAgo(timestamp, LOCALE, NOW)).toBe(expected);
    });

    it("should format Jan 1 of the same year", () => {
      const timestamp = new Date("2025-01-01T00:00:00Z").getTime();
      const expected = new Intl.DateTimeFormat(LOCALE, {
        day: "numeric",
        month: "short",
      }).format(new Date(timestamp));
      expect(formatTimeAgo(timestamp, LOCALE, NOW)).toBe(expected);
    });
  });

  describe("absolute date across years", () => {
    it("should format a date in a previous year with 2-digit year", () => {
      const timestamp = new Date("2024-01-12T12:00:00Z").getTime();
      const expected = new Intl.DateTimeFormat(LOCALE, {
        day: "numeric",
        month: "short",
        year: "2-digit",
      }).format(new Date(timestamp));
      expect(formatTimeAgo(timestamp, LOCALE, NOW)).toBe(expected);
    });

    it("should format Dec 31 of the previous year with year", () => {
      const timestamp = new Date("2024-06-15T12:00:00Z").getTime();
      const expected = new Intl.DateTimeFormat(LOCALE, {
        day: "numeric",
        month: "short",
        year: "2-digit",
      }).format(new Date(timestamp));
      expect(formatTimeAgo(timestamp, LOCALE, NOW)).toBe(expected);
    });
  });
});
