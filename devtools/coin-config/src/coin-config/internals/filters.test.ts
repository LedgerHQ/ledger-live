import { isKeyFilter, matchesFilter, matchesSearch } from "./filters";

describe("matchesFilter", () => {
  const overrides = { config_nft_currencies: [] };

  it.each([
    ["coins", "config_currency_solana", true],
    ["coins", "config_nft_currencies", false],
    ["overridden", "config_nft_currencies", true],
    ["overridden", "config_currency_solana", false],
    ["all", "config_countervalues_refreshRate", true],
  ] as const)("should %s match %s: %s", (filter, key, expected) => {
    expect(matchesFilter(filter, key, overrides)).toBe(expected);
  });
});

describe("matchesSearch", () => {
  it("should match every key when the search is blank", () => {
    expect(matchesSearch("config_currency_solana", "  ")).toBe(true);
  });

  it("should match a key containing the search, ignoring case", () => {
    expect(matchesSearch("config_countervalues_refreshRate", "REFRESH")).toBe(true);
    expect(matchesSearch("config_currency_solana", "bitcoin")).toBe(false);
  });
});

describe("isKeyFilter", () => {
  it("should accept known filters only", () => {
    expect(isKeyFilter("overridden")).toBe(true);
    expect(isKeyFilter("enabled")).toBe(false);
  });
});
