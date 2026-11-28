import {
  cosmosDefaults,
  DEFAULT_GET_BLOCK_CONCURRENCY,
  DEFAULT_GET_BLOCK_PAGINATION_LIMIT,
  isGetBlockConfigurationValid,
  resolveGetBlockConcurrency,
  resolveGetBlockPaginationLimit,
} from "./config";

describe("cosmos config", () => {
  it("paginates the transactions of a block 100 by 100 by default", () => {
    expect(DEFAULT_GET_BLOCK_PAGINATION_LIMIT).toBe(100);
  });

  it("fetches the pages of a block 5 at a time by default", () => {
    expect(DEFAULT_GET_BLOCK_CONCURRENCY).toBe(5);
  });

  it.each(Object.entries(cosmosDefaults))(
    "%s carries the default getBlock pagination limit and concurrency",
    (_currencyId, config) => {
      expect(config.getBlock).toEqual({ pagination: { limit: 100 }, concurrency: 5 });
    },
  );
});

describe("isGetBlockConfigurationValid", () => {
  it.each([
    ["the pagination limit of a default config", cosmosDefaults.cosmos.getBlock],
    ["a positive integer limit and concurrency", { pagination: { limit: 7 }, concurrency: 3 }],
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
    ["a pagination without limit", { pagination: {}, concurrency: 5 }],
    ["a missing concurrency", { pagination: { limit: 7 } }],
    ["a zero concurrency", { pagination: { limit: 7 }, concurrency: 0 }],
    ["a string concurrency", { pagination: { limit: 7 }, concurrency: "5" }],
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

describe("resolveGetBlockPaginationLimit", () => {
  it("reads a valid limit", () => {
    expect(resolveGetBlockPaginationLimit({ pagination: { limit: 7 } })).toBe(7);
  });

  it.each([undefined, null, {}, { pagination: null }, { pagination: { limit: 0 } }])(
    "falls back to the default for %p",
    value => {
      expect(resolveGetBlockPaginationLimit(value)).toBe(DEFAULT_GET_BLOCK_PAGINATION_LIMIT);
    },
  );
});

describe("resolveGetBlockConcurrency", () => {
  it("reads a valid concurrency", () => {
    expect(resolveGetBlockConcurrency({ concurrency: 3 })).toBe(3);
  });

  it.each([undefined, null, {}, { concurrency: 0 }, { concurrency: "5" }])(
    "falls back to the default for %p",
    value => {
      expect(resolveGetBlockConcurrency(value)).toBe(DEFAULT_GET_BLOCK_CONCURRENCY);
    },
  );
});
