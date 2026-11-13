import { matchAnalyticsFilterOption } from "./matchAnalyticsFilterOption";

const algorand = {
  value: "algorand",
  label: "Algorand",
  meta: { iconId: "algorand", ticker: "ALGO", networkName: "Algorand" },
};
const usdcOnPolygon = {
  value: "usdc-polygon",
  label: "USD Coin",
  meta: { iconId: "polygon/erc20/usdc", ticker: "USDC", networkName: "Polygon" },
};
const allAssets = { value: "", label: "All assets" };

describe("matchAnalyticsFilterOption", () => {
  it("should match every option when the query is blank", () => {
    expect(matchAnalyticsFilterOption(algorand, "   ")).toBe(true);
    expect(matchAnalyticsFilterOption(allAssets, "")).toBe(true);
  });

  it("should match the label whatever the case", () => {
    expect(matchAnalyticsFilterOption(algorand, "alGO")).toBe(true);
  });

  it("should match the ticker and the network name", () => {
    expect(matchAnalyticsFilterOption(usdcOnPolygon, "usdc")).toBe(true);
    expect(matchAnalyticsFilterOption(usdcOnPolygon, "poly")).toBe(true);
  });

  it("should ignore the spaces around the query", () => {
    expect(matchAnalyticsFilterOption(algorand, " algo ")).toBe(true);
  });

  it("should reject an option that matches nothing", () => {
    expect(matchAnalyticsFilterOption(algorand, "bitcoin")).toBe(false);
    expect(matchAnalyticsFilterOption(allAssets, "bitcoin")).toBe(false);
  });
});
