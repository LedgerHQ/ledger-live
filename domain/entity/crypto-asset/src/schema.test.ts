import { CryptoAssetStateSchema, CurrencyIdSchema, TimestampSchema } from "./schema";
import { mockCryptoAssetState } from "./schema.mock";

describe("CurrencyIdSchema", () => {
  it("accepts a non-empty string", () => {
    expect(CurrencyIdSchema.parse("bitcoin")).toBe("bitcoin");
  });

  it("rejects an empty string", () => {
    expect(() => CurrencyIdSchema.parse("")).toThrow();
  });
});

describe("TimestampSchema", () => {
  it("accepts zero", () => {
    expect(TimestampSchema.parse(0)).toBe(0);
  });

  it("accepts a positive integer", () => {
    expect(TimestampSchema.parse(1700000000000)).toBe(1700000000000);
  });

  it("rejects a negative number", () => {
    expect(() => TimestampSchema.parse(-1)).toThrow();
  });

  it("rejects a float", () => {
    expect(() => TimestampSchema.parse(1.5)).toThrow();
  });
});

describe("CryptoAssetStateSchema", () => {
  it("parses a valid state from mock factory", () => {
    const state = mockCryptoAssetState();
    const result = CryptoAssetStateSchema.parse(state);
    expect(result).toEqual(state);
  });

  it("parses a state with empty supportedCurrencyIds", () => {
    const result = CryptoAssetStateSchema.parse({
      supportedCurrencyIds: [],
      lastSync: null,
    });
    expect(result.supportedCurrencyIds).toEqual([]);
    expect(result.lastSync).toBeNull();
  });

  it("accepts null lastSync", () => {
    const result = CryptoAssetStateSchema.parse({
      supportedCurrencyIds: [],
      lastSync: null,
    });
    expect(result.lastSync).toBeNull();
  });

  it("rejects supportedCurrencyIds containing empty strings", () => {
    expect(() =>
      CryptoAssetStateSchema.parse({
        supportedCurrencyIds: [""],
        lastSync: null,
      }),
    ).toThrow();
  });

  it("rejects when supportedCurrencyIds is missing", () => {
    expect(() =>
      CryptoAssetStateSchema.parse({ lastSync: null }),
    ).toThrow();
  });

  it("rejects when lastSync is missing", () => {
    expect(() =>
      CryptoAssetStateSchema.parse({ supportedCurrencyIds: [] }),
    ).toThrow();
  });
});
