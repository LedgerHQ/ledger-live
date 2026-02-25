import { getTimeAgo, TimeAgoResult, MINUTE_MS, WEEK_MS } from "../timeAgo";

const SECOND_MS = 1_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const now = 1_700_000_000_000; // Fixed reference: 2023-11-14T22:13:20.000Z

describe("getTimeAgo", () => {
  describe("justNow — elapsed < 1 minute", () => {
    it("should return justNow when elapsed is 0ms", () => {
      expect(getTimeAgo(now, now)).toEqual<TimeAgoResult>({ key: "justNow" });
    });

    it("should return justNow at exactly 59 seconds", () => {
      expect(getTimeAgo(now - 59 * SECOND_MS, now)).toEqual<TimeAgoResult>({ key: "justNow" });
    });
  });

  describe("minutesAgo — elapsed < 1 hour", () => {
    it("should return minutesAgo at exactly 1 minute", () => {
      expect(getTimeAgo(now - MINUTE_MS, now)).toEqual<TimeAgoResult>({
        key: "minutesAgo",
        count: 1,
      });
    });

    it("should return minutesAgo at 59 minutes", () => {
      expect(getTimeAgo(now - 59 * MINUTE_MS, now)).toEqual<TimeAgoResult>({
        key: "minutesAgo",
        count: 59,
      });
    });

    it("should floor partial minutes", () => {
      expect(getTimeAgo(now - (3 * MINUTE_MS + 45 * SECOND_MS), now)).toEqual<TimeAgoResult>({
        key: "minutesAgo",
        count: 3,
      });
    });
  });

  describe("hoursAgo — elapsed < 24 hours", () => {
    it("should return hoursAgo at exactly 1 hour", () => {
      expect(getTimeAgo(now - HOUR_MS, now)).toEqual<TimeAgoResult>({
        key: "hoursAgo",
        count: 1,
      });
    });

    it("should return hoursAgo at 2 hours", () => {
      expect(getTimeAgo(now - 2 * HOUR_MS, now)).toEqual<TimeAgoResult>({
        key: "hoursAgo",
        count: 2,
      });
    });

    it("should return hoursAgo at 23 hours", () => {
      expect(getTimeAgo(now - 23 * HOUR_MS, now)).toEqual<TimeAgoResult>({
        key: "hoursAgo",
        count: 23,
      });
    });

    it("should floor partial hours", () => {
      expect(getTimeAgo(now - (2 * HOUR_MS + 45 * MINUTE_MS), now)).toEqual<TimeAgoResult>({
        key: "hoursAgo",
        count: 2,
      });
    });
  });

  describe("daysAgo — elapsed < 7 days", () => {
    it("should return daysAgo at exactly 1 day", () => {
      expect(getTimeAgo(now - DAY_MS, now)).toEqual<TimeAgoResult>({
        key: "daysAgo",
        count: 1,
      });
    });

    it("should return daysAgo at 6 days", () => {
      expect(getTimeAgo(now - 6 * DAY_MS, now)).toEqual<TimeAgoResult>({
        key: "daysAgo",
        count: 6,
      });
    });

    it("should floor partial days", () => {
      expect(getTimeAgo(now - (3 * DAY_MS + 12 * HOUR_MS), now)).toEqual<TimeAgoResult>({
        key: "daysAgo",
        count: 3,
      });
    });
  });

  describe("dateInYear — elapsed >= 7 days, same calendar year", () => {
    it("should return dateInYear at exactly 7 days", () => {
      const timestamp = now - WEEK_MS;
      expect(getTimeAgo(timestamp, now)).toEqual<TimeAgoResult>({
        key: "dateInYear",
        timestamp,
      });
    });

    it("should return dateInYear for 30 days ago in the same year", () => {
      // now = 2023-11-14, minus 30 days = 2023-10-15 — same year
      const timestamp = now - 30 * DAY_MS;
      expect(getTimeAgo(timestamp, now)).toEqual<TimeAgoResult>({
        key: "dateInYear",
        timestamp,
      });
    });

    it("should return dateInYear on Jan 1 of the same year", () => {
      // now = 2023-11-14, Jan 1 2023
      const jan1SameYear = new Date(2023, 0, 1).getTime();
      expect(getTimeAgo(jan1SameYear, now)).toEqual<TimeAgoResult>({
        key: "dateInYear",
        timestamp: jan1SameYear,
      });
    });
  });

  describe("dateAcrossYears — elapsed >= 7 days, different calendar year", () => {
    it("should return dateAcrossYears for a date in a previous year", () => {
      // now = 2023-11-14, timestamp = 2022-01-01
      const timestamp = new Date(2022, 0, 1).getTime();
      expect(getTimeAgo(timestamp, now)).toEqual<TimeAgoResult>({
        key: "dateAcrossYears",
        timestamp,
      });
    });

    it("should return dateAcrossYears for Dec 31 of previous year", () => {
      const dec31PrevYear = new Date(2022, 11, 31).getTime();
      expect(getTimeAgo(dec31PrevYear, now)).toEqual<TimeAgoResult>({
        key: "dateAcrossYears",
        timestamp: dec31PrevYear,
      });
    });
  });

  describe("default now parameter", () => {
    it("should use Date.now() when now is not provided", () => {
      const timestamp = Date.now() - 5 * MINUTE_MS;
      expect(getTimeAgo(timestamp).key).toBe("minutesAgo");
    });
  });
});
