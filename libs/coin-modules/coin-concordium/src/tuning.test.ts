import { boolean, ConcordiumInvalidConfigError, nonNegativeInt, positiveInt } from "./tuning";

describe("positiveInt", () => {
  it("takes an integer of at least 1", () => {
    expect(positiveInt("gateway.timeoutMs", 1)).toBe(1);
  });

  it.each([undefined, null, "10", 12.5, Number.NaN, Infinity, 0, -1])("rejects %p", value => {
    expect(() => positiveInt("gateway.timeoutMs", value)).toThrow(
      new ConcordiumInvalidConfigError(
        `concordium: coin config gateway.timeoutMs must be an integer >= 1, got ${String(value)}`,
      ),
    );
  });
});

describe("nonNegativeInt", () => {
  it("takes zero", () => {
    expect(nonNegativeInt("gateway.retries", 0)).toBe(0);
  });

  it.each([undefined, -1, 0.5])("rejects %p", value => {
    expect(() => nonNegativeInt("gateway.retries", value)).toThrow(ConcordiumInvalidConfigError);
  });
});

describe("boolean", () => {
  it.each([true, false])("takes %p", value => {
    expect(boolean("enableTokens", value)).toBe(value);
  });

  it.each(["false", "true", 1, 0, null, undefined])("rejects %p", value => {
    expect(() => boolean("enableTokens", value)).toThrow(ConcordiumInvalidConfigError);
  });
});
