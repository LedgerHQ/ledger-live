import { resolveMarketListRefreshRate } from "../timers";

describe("resolveMarketListRefreshRate", () => {
  it("turns a positive refresh time into minutes", () => {
    expect(resolveMarketListRefreshRate(1)).toBe(60_000);
  });

  it("falls back to three minutes when the refresh time is missing", () => {
    expect(resolveMarketListRefreshRate(undefined)).toBe(180_000);
    expect(resolveMarketListRefreshRate(0)).toBe(180_000);
  });
});
