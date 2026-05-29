import { getSeriesExtrema } from "../utils/getSeriesExtrema";
import { getExtremaPointMarkers } from "../utils/getExtremaPointMarkers";
import type { LineChartSeries } from "../types";

function makeSeries(data: (number | null)[]): LineChartSeries[] {
  return [{ id: "test", data, label: "Test", stroke: "" }];
}

describe("getSeriesExtrema", () => {
  it("returns null for an empty series list", () => {
    expect(getSeriesExtrema([])).toBeNull();
  });

  it("returns null when the primary series has no data", () => {
    expect(getSeriesExtrema([{ id: "x", data: [], label: "x", stroke: "" }])).toBeNull();
  });

  it("returns null when all data points are null", () => {
    expect(getSeriesExtrema(makeSeries([null, null, null]))).toBeNull();
  });

  it("returns the same index for min and max when there is a single point", () => {
    expect(getSeriesExtrema(makeSeries([42]))).toEqual({
      min: { index: 0, value: 42 },
      max: { index: 0, value: 42 },
    });
  });

  it("returns min and max indexes for the primary series", () => {
    expect(getSeriesExtrema(makeSeries([3, 1, 4, 1, 5, 9, 2, 6]))).toEqual({
      min: { index: 1, value: 1 },
      max: { index: 5, value: 9 },
    });
  });

  it("returns the first occurrence when extrema repeat", () => {
    expect(getSeriesExtrema(makeSeries([5, 1, 5, 1, 3]))).toEqual({
      min: { index: 1, value: 1 },
      max: { index: 0, value: 5 },
    });
  });

  it("skips null gaps", () => {
    expect(getSeriesExtrema(makeSeries([null, 2, null, 7, null, 0, null]))).toEqual({
      min: { index: 5, value: 0 },
      max: { index: 3, value: 7 },
    });
  });
});

describe("getExtremaPointMarkers", () => {
  it("returns [] when there are no extrema", () => {
    expect(getExtremaPointMarkers([])).toEqual([]);
    expect(getExtremaPointMarkers(makeSeries([null, null]))).toEqual([]);
  });

  it("emits a top success max marker and a bottom error min marker", () => {
    expect(getExtremaPointMarkers(makeSeries([3, 1, 4, 9, 2]))).toEqual([
      { index: 3, value: 9, color: "success", labelPosition: "top" },
      { index: 1, value: 1, color: "error", labelPosition: "bottom" },
    ]);
  });
});
