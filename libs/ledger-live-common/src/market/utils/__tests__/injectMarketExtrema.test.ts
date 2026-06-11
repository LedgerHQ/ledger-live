import { injectMarketExtrema } from "../injectMarketExtrema";
import { ChartDataPoint } from "../types";

const series: ChartDataPoint[] = [
  [1000, 10],
  [2000, 30],
  [3000, 20],
];

describe("injectMarketExtrema", () => {
  it("inserts ath and atl at their sorted position", () => {
    const result = injectMarketExtrema(series, {
      ath: 100,
      athDate: 2500,
      atl: 5,
      atlDate: 1500,
    });

    expect(result).toEqual([
      [1000, 10],
      [1500, 5],
      [2000, 30],
      [2500, 100],
      [3000, 20],
    ]);
  });

  it("makes the injected ath/atl the series extrema", () => {
    const result = injectMarketExtrema(series, {
      ath: 100,
      athDate: 2500,
      atl: 5,
      atlDate: 1500,
    });
    const values = result.map(([, value]) => value);

    expect(Math.max(...values)).toBe(100);
    expect(Math.min(...values)).toBe(5);
  });

  it("accepts Date instances for the dates", () => {
    const result = injectMarketExtrema(series, {
      ath: 100,
      athDate: new Date(2500),
      atl: 5,
      atlDate: new Date(1500),
    });

    expect(result).toContainEqual([2500, 100]);
    expect(result).toContainEqual([1500, 5]);
  });

  it("appends when the date is after every point", () => {
    const result = injectMarketExtrema(series, { ath: 100, athDate: 9000 });

    expect(result[result.length - 1]).toEqual([9000, 100]);
  });

  it("reconciles a colliding timestamp without lowering a high or raising a low", () => {
    const result = injectMarketExtrema(series, {
      ath: 25, // lower than the existing 30 at ts 2000
      athDate: 2000,
      atl: 25, // higher than the existing 10 at ts 1000
      atlDate: 1000,
    });

    expect(result).toContainEqual([2000, 30]);
    expect(result).toContainEqual([1000, 10]);
  });

  it("does not mutate the input", () => {
    const input: ChartDataPoint[] = [[1000, 10]];
    injectMarketExtrema(input, { ath: 100, athDate: 2000 });

    expect(input).toEqual([[1000, 10]]);
  });

  it("skips invalid or missing values and dates", () => {
    const result = injectMarketExtrema(series, {
      ath: NaN,
      athDate: 2500,
      atl: 5,
      atlDate: undefined,
    });

    expect(result).toEqual(series);
  });

  it("returns a copy of an empty series", () => {
    const empty: ChartDataPoint[] = [];
    const result = injectMarketExtrema(empty, { ath: 100, athDate: 2000 });

    expect(result).toEqual([]);
    expect(result).not.toBe(empty);
  });
});
