import { getEvenlySpacedTicks } from "../utils/getEvenlySpacedTicks";
import {
  buildLineChartBottomPaddedYAxisConfig,
  buildLineChartXAxisConfig,
} from "../utils/lineChartAxisConfig";

describe("getEvenlySpacedTicks", () => {
  it("returns an empty array when length is zero", () => {
    expect(getEvenlySpacedTicks(0, 5)).toEqual([]);
  });

  it("returns all indices when length is below minTicks", () => {
    expect(getEvenlySpacedTicks(3, 5)).toEqual([0, 1, 2]);
  });

  it("returns evenly spaced ticks including first and last indices", () => {
    expect(getEvenlySpacedTicks(10, 5)).toEqual([0, 2, 5, 7, 9]);
  });

  it("falls back to first and last indices when minTicks is below 2", () => {
    expect(getEvenlySpacedTicks(10, 1)).toEqual([0, 9]);
    expect(getEvenlySpacedTicks(10, 0)).toEqual([0, 9]);
  });
});

describe("buildLineChartXAxisConfig", () => {
  it("formats tick labels from timestamps", () => {
    const timestamps = [1_000, 2_000, 3_000];
    const config = buildLineChartXAxisConfig({
      timestamps,
      selectedRange: "1w",
      formatDate: timestamp => `date-${timestamp}`,
    });

    expect(config.tickLabelFormatter?.(1)).toBe("date-2000");
    expect(config.ticks).toEqual([0, 1, 2]);
  });
});

describe("buildLineChartBottomPaddedYAxisConfig", () => {
  it("extends the min domain below the data range", () => {
    const config = buildLineChartBottomPaddedYAxisConfig(240, 50);
    const domainFn = config.domain;
    if (typeof domainFn !== "function") {
      throw new Error("Expected y-axis domain to be a function");
    }
    const domain = domainFn({ min: 100, max: 200 });

    expect(domain.max).toBe(200);
    expect(domain.min).toBeCloseTo(79.16666666666667);
  });
});
