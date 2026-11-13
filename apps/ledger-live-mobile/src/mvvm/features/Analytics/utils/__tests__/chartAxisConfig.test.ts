import { DEFAULT_LINE_CHART_HEIGHT } from "LLM/components/LineChart";
import { buildAnalyticsChartYAxisConfig } from "../chartAxisConfig";

function domainOf(min: number, max: number) {
  const { domain } = buildAnalyticsChartYAxisConfig();
  if (typeof domain !== "function") throw new Error("Expected a domain function");
  return domain({ min, max });
}

describe("buildAnalyticsChartYAxisConfig", () => {
  it("should leave room above a flat series for its value label", () => {
    const domain = domainOf(0, 0);
    expect(domain.max).toBeGreaterThan(0);
    expect(domain.min).toBeLessThan(0);
  });

  it("should leave 24px above the highest value for its label and room under the lowest", () => {
    const domain = domainOf(100, 200);
    const valuePerPx = (domain.max - domain.min) / DEFAULT_LINE_CHART_HEIGHT;
    expect((domain.max - 200) / valuePerPx).toBeCloseTo(24);
    expect(domain.min).toBeLessThan(100);
  });
});
