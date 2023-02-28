import {
  startOfHour,
  startOfMonth,
  startOfDay,
  startOfWeek,
  getPortfolioRangeConfig,
  getDates,
  getRanges,
} from "./rangeDates";

describe("startOfHour", () => {
  test("basic test", () => {
    expect(startOfHour(new Date(1655827384305)).toISOString()).toBe(
      "2022-06-21T16:00:00.000Z"
    );
  });
});
describe("startOfDay", () => {
  test("basic test", () => {
    expect(startOfDay(new Date(1655827384305)).toISOString()).toBe(
      "2022-06-21T04:00:00.000Z"
    );
  });
});
describe("startOfMonth", () => {
  test("basic test", () => {
    expect(startOfMonth(new Date(1655827384305)).toISOString()).toBe(
      "2022-06-01T04:00:00.000Z"
    );
  });
});
describe("startOfWeek", () => {
  test("basic test", () => {
    expect(startOfWeek(new Date(1655827384305)).toISOString()).toBe(
      "2022-06-19T04:00:00.000Z"
    );
  });
});
describe("getPortfolioRangeConfig", () => {
  test("returns a value for day", () => {
    expect(getPortfolioRangeConfig("day")).toBeDefined();
  });
  test("returns a value for week", () => {
    expect(getPortfolioRangeConfig("week")).toBeDefined();
  });
  test("returns a value for month", () => {
    expect(getPortfolioRangeConfig("month")).toBeDefined();
  });
});
describe("getDates", () => {
  test("day returns an array of asked size", () => {
    expect(getDates("day", 100).length).toEqual(100);
  });
  test("week returns an array of asked size", () => {
    expect(getDates("week", 100).length).toEqual(100);
  });
  test("month returns an array of asked size", () => {
    expect(getDates("month", 100).length).toEqual(100);
  });
});

describe("getRanges", () => {
  test("returns a non empty array", () => {
    expect(getRanges().length).toBeGreaterThan(0);
  });
});
