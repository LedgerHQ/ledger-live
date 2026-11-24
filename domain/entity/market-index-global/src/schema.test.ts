import { MarketIndexGlobalSchema } from "./schema";

describe("MarketIndexGlobalSchema", () => {
  it("validates a well-formed index", () => {
    expect(
      MarketIndexGlobalSchema.parse({ marketCap: 2_450_000_000_000, changePercentage24h: -1.71 }),
    ).toEqual({ marketCap: 2_450_000_000_000, changePercentage24h: -1.71 });
  });

  it("accepts a zero change", () => {
    expect(() =>
      MarketIndexGlobalSchema.parse({ marketCap: 1, changePercentage24h: 0 }),
    ).not.toThrow();
  });

  it("rejects a marketCap that is not a number", () => {
    expect(
      MarketIndexGlobalSchema.safeParse({ marketCap: "1", changePercentage24h: 0 }).success,
    ).toBe(false);
  });

  it("rejects a payload missing changePercentage24h", () => {
    expect(MarketIndexGlobalSchema.safeParse({ marketCap: 1 }).success).toBe(false);
  });
});
