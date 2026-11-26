import { createMockCoinConfigValue } from "./test/fixtures";
import { DEFAULT_MAX_TX_QUERY, DEFAULT_MIN_RESERVE, GATEWAY_MAX_TX_QUERY } from "./constants";
import { getMaxTxQuery, getMinReserve, tuning } from "./tuning";

describe("tuning", () => {
  it("returns an integer override of at least the minimum", () => {
    expect(tuning(5, 10)).toBe(5);
    expect(tuning(0, 10)).toBe(0);
    expect(tuning(1, 10, 1)).toBe(1);
  });

  it.each([undefined, null, "5", 1.5, Number.NaN, -1])("falls back for %p", value => {
    expect(tuning(value, 10)).toBe(10);
  });

  it("falls back below the minimum", () => {
    expect(tuning(0, 10, 1)).toBe(10);
  });
});

describe("getMaxTxQuery", () => {
  it("reads the configured page size", () => {
    expect(getMaxTxQuery(createMockCoinConfigValue({ gateway: { maxTxQuery: 250 } }))).toBe(250);
  });

  it("clamps an override above the gateway's page ceiling", () => {
    expect(getMaxTxQuery(createMockCoinConfigValue({ gateway: { maxTxQuery: 5_000 } }))).toBe(
      GATEWAY_MAX_TX_QUERY,
    );
  });

  it.each([undefined, 0, 2.5])("falls back to the default for %p", maxTxQuery => {
    const config = createMockCoinConfigValue(
      maxTxQuery === undefined ? {} : { gateway: { maxTxQuery } },
    );
    expect(getMaxTxQuery(config)).toBe(DEFAULT_MAX_TX_QUERY);
  });
});

describe("getMinReserve", () => {
  it.each([0, 12.5, 100])("reads a configured reserve of %p", minReserve => {
    expect(getMinReserve(createMockCoinConfigValue({ minReserve })).toNumber()).toBe(minReserve);
  });

  it.each(["100", "123456789012345678901234567890", "1e309"])(
    "reads the numeric string %p exactly",
    minReserve => {
      const config = {
        ...createMockCoinConfigValue(),
        minReserve: minReserve as unknown as number,
      };
      expect(getMinReserve(config).eq(minReserve)).toBe(true);
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])("falls back for %p", minReserve => {
    expect(getMinReserve(createMockCoinConfigValue({ minReserve })).toNumber()).toBe(
      DEFAULT_MIN_RESERVE,
    );
  });

  it("falls back when unset", () => {
    const { minReserve: _, ...config } = createMockCoinConfigValue();
    expect(getMinReserve(config).toNumber()).toBe(DEFAULT_MIN_RESERVE);
  });
});
