import { getEvenlySpacedTicks } from "../utils/getEvenlySpacedTicks";
import {
  buildLineChartPaddedYAxisConfig,
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

function domainOf(min: number, max: number) {
  const domainFn = buildLineChartPaddedYAxisConfig({
    chartBaseHeight: 240,
    drawingHeight: 210,
    bottomOffsetPx: 50,
    topOffsetPx: 24,
  }).domain;
  if (typeof domainFn !== "function") {
    throw new Error("Expected y-axis domain to be a function");
  }
  return domainFn({ min, max });
}

describe("buildLineChartPaddedYAxisConfig", () => {
  it("extends the min domain below the data range", () => {
    expect(domainOf(100, 200).min).toBeCloseTo(79.16666666666667);
  });

  it("leaves 24px above the max so its label stays under the scrubber overlay", () => {
    const domain = domainOf(100, 200);
    const valuePerPx = (domain.max - domain.min) / 210;

    expect((domain.max - 200) / valuePerPx).toBeCloseTo(24);
  });
});
