import { buildTooltipRow } from "../utils/buildTooltipRow";
import type { LineChartSeries } from "../types";

function makeSeries(
  data: (number | null)[],
  overrides: Partial<LineChartSeries> = {},
): LineChartSeries {
  return { id: "price", data, label: "Price", stroke: "", ...overrides };
}

const formatValue = (value: number) => `$${value}`;

describe("buildTooltipRow", () => {
  it("returns a formatted row for a valid data point", () => {
    expect(buildTooltipRow(makeSeries([10, 20, 30]), 1, formatValue)).toEqual({
      label: "Price",
      value: "$20",
    });
  });

  it("falls back to the series id when no label is set", () => {
    const series = makeSeries([5], { label: undefined });
    expect(buildTooltipRow(series, 0, formatValue)).toEqual({
      label: "price",
      value: "$5",
    });
  });

  it("returns null when the value is missing", () => {
    expect(buildTooltipRow(makeSeries([1, 2]), 5, formatValue)).toBeNull();
  });

  it("returns null for null and NaN values", () => {
    expect(buildTooltipRow(makeSeries([null, 2]), 0, formatValue)).toBeNull();
    expect(buildTooltipRow(makeSeries([NaN, 2]), 0, formatValue)).toBeNull();
  });
});
