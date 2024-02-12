import { startOfHour, startOfDay, startOfWeek } from ".";

describe("date utils", () => {
  describe("Timezones", () => {
    it("should always be America/New_York", () => {
      expect(process.env.TZ).toBe("America/New_York");
      expect(new Date().getTimezoneOffset()).toBe(300);
    });
  });

  describe("startOfHour", () => {
    test("basic test", () => {
      expect(startOfHour(new Date(1655827384305)).toISOString()).toBe("2022-06-21T16:00:00.000Z");
    });
  });
  describe("startOfDay", () => {
    test("basic test", () => {
      expect(startOfDay(new Date(1655827384305)).toISOString()).toBe("2022-06-21T04:00:00.000Z");
    });
  });
  describe("startOfWeek", () => {
    test("basic test", () => {
      expect(startOfWeek(new Date(1655827384305)).toISOString()).toBe("2022-06-19T04:00:00.000Z");
    });
  });
});
