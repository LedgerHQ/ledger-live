import { MarketIndexGlobalSchema } from "./schema";

describe("MarketIndexGlobalSchema", () => {
  it("accepts a valid snapshot", () => {
    expect(
      MarketIndexGlobalSchema.safeParse({ marketCap: 1e12, changePercentage24h: -1.71 }).success,
    ).toBe(true);
  });

  it("rejects a missing field", () => {
    expect(MarketIndexGlobalSchema.safeParse({ marketCap: 1e12 }).success).toBe(false);
  });
});
