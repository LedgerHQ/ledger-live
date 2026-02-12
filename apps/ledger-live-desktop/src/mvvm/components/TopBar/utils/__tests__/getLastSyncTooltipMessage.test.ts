import { getLastSyncTooltipDescriptor } from "../getLastSyncTooltipMessage";

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

describe("getLastSyncTooltipDescriptor", () => {
  describe("less than 1 minute", () => {
    it("returns upToDate when elapsed is 0", () => {
      expect(getLastSyncTooltipDescriptor(0)).toEqual({
        key: "topBar.activityIndicator.upToDate",
      });
    });

    it("returns upToDate when elapsed is just under 1 minute", () => {
      expect(getLastSyncTooltipDescriptor(MS_PER_MINUTE - 1)).toEqual({
        key: "topBar.activityIndicator.upToDate",
      });
    });
  });

  describe("less than 1 hour", () => {
    it("returns minutesAgo with count 1 for exactly 1 minute", () => {
      expect(getLastSyncTooltipDescriptor(MS_PER_MINUTE)).toEqual({
        key: "topBar.activityIndicator.minutesAgo",
        count: 1,
      });
    });

    it("returns minutesAgo with correct count for multiple minutes", () => {
      expect(getLastSyncTooltipDescriptor(3 * MS_PER_MINUTE)).toEqual({
        key: "topBar.activityIndicator.minutesAgo",
        count: 3,
      });
      expect(getLastSyncTooltipDescriptor(59 * MS_PER_MINUTE)).toEqual({
        key: "topBar.activityIndicator.minutesAgo",
        count: 59,
      });
    });

    it("floors fractional minutes", () => {
      expect(getLastSyncTooltipDescriptor(2.7 * MS_PER_MINUTE)).toEqual({
        key: "topBar.activityIndicator.minutesAgo",
        count: 2,
      });
    });
  });

  describe("less than 24 hours", () => {
    it("returns hoursAgo with count 1 for exactly 1 hour", () => {
      expect(getLastSyncTooltipDescriptor(MS_PER_HOUR)).toEqual({
        key: "topBar.activityIndicator.hoursAgo",
        count: 1,
      });
    });

    it("returns hoursAgo with correct count for multiple hours", () => {
      expect(getLastSyncTooltipDescriptor(2 * MS_PER_HOUR)).toEqual({
        key: "topBar.activityIndicator.hoursAgo",
        count: 2,
      });
      expect(getLastSyncTooltipDescriptor(23 * MS_PER_HOUR)).toEqual({
        key: "topBar.activityIndicator.hoursAgo",
        count: 23,
      });
    });

    it("floors fractional hours", () => {
      expect(getLastSyncTooltipDescriptor(5.9 * MS_PER_HOUR)).toEqual({
        key: "topBar.activityIndicator.hoursAgo",
        count: 5,
      });
    });
  });

  describe("24 hours or more", () => {
    it("returns daysAgo with count 1 for exactly 24 hours", () => {
      expect(getLastSyncTooltipDescriptor(MS_PER_DAY)).toEqual({
        key: "topBar.activityIndicator.daysAgo",
        count: 1,
      });
    });

    it("returns daysAgo with correct count for multiple days", () => {
      expect(getLastSyncTooltipDescriptor(2 * MS_PER_DAY)).toEqual({
        key: "topBar.activityIndicator.daysAgo",
        count: 2,
      });
      expect(getLastSyncTooltipDescriptor(30 * MS_PER_DAY)).toEqual({
        key: "topBar.activityIndicator.daysAgo",
        count: 30,
      });
    });

    it("floors fractional days", () => {
      expect(getLastSyncTooltipDescriptor(3.2 * MS_PER_DAY)).toEqual({
        key: "topBar.activityIndicator.daysAgo",
        count: 3,
      });
    });
  });
});
