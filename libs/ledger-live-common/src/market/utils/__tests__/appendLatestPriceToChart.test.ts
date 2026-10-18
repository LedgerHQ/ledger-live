import { appendLatestPriceToChart } from "../appendLatestPriceToChart";
import type { ChartDataPoint } from "../types";

const points: ChartDataPoint[] = [
  [1_000, 100],
  [2_000, 120],
];

describe("appendLatestPriceToChart", () => {
  it("should append the live price after the last historical point when now is later", () => {
    expect(appendLatestPriceToChart(points, 150, 3_000)).toEqual([
      [1_000, 100],
      [2_000, 120],
      [3_000, 150],
    ]);
  });

  it("should replace the last value when its timestamp is not before now", () => {
    expect(appendLatestPriceToChart(points, 150, 2_000)).toEqual([
      [1_000, 100],
      [2_000, 150],
    ]);
    expect(appendLatestPriceToChart(points, 150, 1_500)).toEqual([
      [1_000, 100],
      [2_000, 150],
    ]);
  });

  it("should return a copy of an empty series", () => {
    const empty: ChartDataPoint[] = [];

    const result = appendLatestPriceToChart(empty, 150, 3_000);

    expect(result).toEqual([]);
    expect(result).not.toBe(empty);
  });

  it.each([undefined, Number.NaN, 0, -1])(
    "should leave the series unchanged when the price is %s",
    latestPrice => {
      expect(appendLatestPriceToChart(points, latestPrice, 3_000)).toEqual(points);
    },
  );

  it("should leave the series unchanged when now is not finite", () => {
    expect(appendLatestPriceToChart(points, 150, Number.NaN)).toEqual(points);
  });

  it("should not mutate the input series", () => {
    const input: ChartDataPoint[] = [
      [1_000, 100],
      [2_000, 120],
    ];

    appendLatestPriceToChart(input, 150, 3_000);
    appendLatestPriceToChart(input, 150, 2_000);

    expect(input).toEqual([
      [1_000, 100],
      [2_000, 120],
    ]);
  });
});
