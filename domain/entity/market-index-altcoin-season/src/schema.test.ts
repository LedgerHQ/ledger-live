import { AltcoinSeasonIndexSchema } from "./schema";

describe("AltcoinSeasonIndexSchema", () => {
  it("validates a well-formed index", () => {
    expect(AltcoinSeasonIndexSchema.parse({ value: 42, altcoinMarketcap: 1234567890 })).toEqual({
      value: 42,
      altcoinMarketcap: 1234567890,
    });
  });

  it("accepts boundary values", () => {
    expect(() => AltcoinSeasonIndexSchema.parse({ value: 0, altcoinMarketcap: 0 })).not.toThrow();
    expect(() => AltcoinSeasonIndexSchema.parse({ value: 100, altcoinMarketcap: 1 })).not.toThrow();
  });

  it("throws when value is out of range", () => {
    expect(() => AltcoinSeasonIndexSchema.parse({ value: 101, altcoinMarketcap: 1 })).toThrow();
  });

  it("throws when altcoinMarketcap is missing", () => {
    expect(() => AltcoinSeasonIndexSchema.parse({ value: 50 })).toThrow();
  });
});
