import { GATEWAY_MAX_TX_QUERY } from "./constants";
import { createMockCoinConfigValue } from "./test/fixtures";
import { boolean, getMaxTxQuery, getMinReserve, nonEmptyString, positiveInt } from "./tuning";
import { CantonInvalidConfigError } from "./types/errors";

describe("positiveInt", () => {
  it("returns an integer of at least 1", () => {
    expect(positiveInt("field", 1)).toBe(1);
    expect(positiveInt("field", 5)).toBe(5);
  });

  it.each([undefined, null, "5", 1.5, Number.NaN, 0, -1])("throws for %p", value => {
    expect(() => positiveInt("some.field", value)).toThrow(CantonInvalidConfigError);
    expect(() => positiveInt("some.field", value)).toThrow("some.field");
  });
});

describe("nonEmptyString", () => {
  it("returns a non-empty string", () => {
    expect(nonEmptyString("field", "value")).toBe("value");
  });

  it.each([undefined, null, "", 5, {}])("throws for %p", value => {
    expect(() => nonEmptyString("some.field", value)).toThrow(CantonInvalidConfigError);
    expect(() => nonEmptyString("some.field", value)).toThrow("some.field");
  });
});

describe("boolean", () => {
  it.each([true, false])("returns %p", value => {
    expect(boolean("field", value)).toBe(value);
  });

  it.each([undefined, null, "false", "true", 1, 0])("throws for %p", value => {
    expect(() => boolean("useGateway", value)).toThrow(CantonInvalidConfigError);
    expect(() => boolean("useGateway", value)).toThrow("useGateway");
  });
});

const withGateway = (gateway: object) =>
  createMockCoinConfigValue({
    gateway: { ...createMockCoinConfigValue().gateway, ...gateway },
  });

describe("getMaxTxQuery", () => {
  it("reads the configured page size", () => {
    expect(getMaxTxQuery(withGateway({ maxTxQuery: 250 }))).toBe(250);
  });

  it("clamps a value above the gateway's page ceiling", () => {
    expect(getMaxTxQuery(withGateway({ maxTxQuery: 5_000 }))).toBe(GATEWAY_MAX_TX_QUERY);
  });

  it.each([undefined, 0, 2.5])("throws for %p", maxTxQuery => {
    expect(() => getMaxTxQuery(withGateway({ maxTxQuery }))).toThrow(CantonInvalidConfigError);
    expect(() => getMaxTxQuery(withGateway({ maxTxQuery }))).toThrow("gateway.maxTxQuery");
  });

  it("throws, naming the field, when the gateway group is missing", () => {
    const { gateway: _, ...config } = createMockCoinConfigValue();
    const missing = config as unknown as Parameters<typeof getMaxTxQuery>[0];

    expect(() => getMaxTxQuery(missing)).toThrow(CantonInvalidConfigError);
    expect(() => getMaxTxQuery(missing)).toThrow("gateway.maxTxQuery");
  });
});

describe("getMinReserve", () => {
  it.each([0, 100])("reads a configured reserve of %p", minReserve => {
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

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 12.5])("throws for %p", minReserve => {
    expect(() => getMinReserve(createMockCoinConfigValue({ minReserve }))).toThrow(
      CantonInvalidConfigError,
    );
  });

  it("throws when unset", () => {
    const { minReserve: _, ...config } = createMockCoinConfigValue();
    const missing = config as unknown as Parameters<typeof getMinReserve>[0];

    expect(() => getMinReserve(missing)).toThrow(CantonInvalidConfigError);
    expect(() => getMinReserve(missing)).toThrow("minReserve");
  });
});
