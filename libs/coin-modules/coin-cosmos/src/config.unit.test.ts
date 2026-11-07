import {
  cosmosDefaults,
  DEFAULT_GET_BLOCK_PAGINATION_LIMIT,
  isGetBlockConfigurationValid,
} from "./config";

describe("cosmos config", () => {
  it("paginates the transactions of a block 100 by 100 by default", () => {
    expect(DEFAULT_GET_BLOCK_PAGINATION_LIMIT).toBe(100);
  });

  it.each(Object.entries(cosmosDefaults))(
    "%s carries the default getBlock pagination limit",
    (_currencyId, config) => {
      expect(config.getBlock).toEqual({ pagination: { limit: 100 } });
    },
  );
});

describe("isGetBlockConfigurationValid", () => {
  it.each([
    ["the pagination limit of a default config", cosmosDefaults.cosmos.getBlock],
    ["a positive integer limit", { pagination: { limit: 7 } }],
  ])("accepts %s", (_name, value) => {
    expect(isGetBlockConfigurationValid(value)).toBe(true);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a string", "pagination"],
    ["an object without pagination", {}],
    ["a null pagination", { pagination: null }],
    ["a non-object pagination", { pagination: "x" }],
    ["a pagination without limit", { pagination: {} }],
    ["a zero limit", { pagination: { limit: 0 } }],
    ["a negative limit", { pagination: { limit: -1 } }],
    ["a fractional limit", { pagination: { limit: 1.5 } }],
    ["a NaN limit", { pagination: { limit: NaN } }],
    ["a string limit", { pagination: { limit: "10" } }],
    ["an unsafe integer limit", { pagination: { limit: Number.MAX_SAFE_INTEGER + 1 } }],
  ])("rejects %s", (_name, value) => {
    expect(isGetBlockConfigurationValid(value)).toBe(false);
  });
});
