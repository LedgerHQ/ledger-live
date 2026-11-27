import { toMarketChartRange } from "./toMarketChartRange";

describe("toMarketChartRange", () => {
  it("keeps a known range", () => {
    expect(toMarketChartRange("1w")).toBe("1w");
  });

  it("drops an unknown range", () => {
    expect(toMarketChartRange("2y")).toBeUndefined();
  });

  it("drops a missing range", () => {
    expect(toMarketChartRange(undefined)).toBeUndefined();
  });
});
