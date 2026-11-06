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

  it("should keep the top at the highest value and leave room under the lowest", () => {
    const domain = domainOf(100, 200);
    expect(domain.max).toBe(200);
    expect(domain.min).toBeLessThan(100);
  });
});
