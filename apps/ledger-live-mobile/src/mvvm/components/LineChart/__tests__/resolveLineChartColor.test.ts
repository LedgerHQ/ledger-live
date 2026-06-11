import { resolveLineChartColorFromPercentChange } from "../utils/resolveLineChartColor";

describe("resolveLineChartColorFromPercentChange", () => {
  it("returns muted when percent is nullish or zero", () => {
    expect(resolveLineChartColorFromPercentChange(null)).toBe("muted");
    expect(resolveLineChartColorFromPercentChange(undefined)).toBe("muted");
    expect(resolveLineChartColorFromPercentChange(0)).toBe("muted");
  });

  it("returns success for positive percent change", () => {
    expect(resolveLineChartColorFromPercentChange(1.5)).toBe("success");
  });

  it("returns error for negative percent change", () => {
    expect(resolveLineChartColorFromPercentChange(-2)).toBe("error");
  });
});
