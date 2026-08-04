import { ApyTypeSchema, InterestRateSchema } from "./schema";

const valid = {
  currencyId: "bitcoin",
  rate: 4.2,
  type: "APY",
  fetchAt: "2026-07-31T00:00:00.000Z",
};

describe("InterestRateSchema", () => {
  it("validates a well-formed rate", () => {
    expect(InterestRateSchema.parse(valid)).toEqual(valid);
  });

  it("accepts a zero rate", () => {
    expect(() => InterestRateSchema.parse({ ...valid, rate: 0 })).not.toThrow();
  });

  it("throws when a required field is missing", () => {
    for (const key of ["currencyId", "rate", "type", "fetchAt"] as const) {
      const { [key]: _omitted, ...rest } = valid;
      expect(() => InterestRateSchema.parse(rest)).toThrow();
    }
  });

  it("throws when rate is not a number", () => {
    expect(() => InterestRateSchema.parse({ ...valid, rate: "4.2" })).toThrow();
  });

  /*
   * `type` is deliberately wider than ApyType. DADA sends kinds the apps do not render, and
   * useInterestRatesByCurrencies drops them. Narrowing here would claim a guarantee the wire
   * does not give.
   */
  it("accepts a rate type outside the ApyType union", () => {
    expect(() => InterestRateSchema.parse({ ...valid, type: "STAKING" })).not.toThrow();
  });

  /*
   * fetchAt is validated as RFC 3339 with a mandatory offset. Every shape DADA sends passes,
   * including its 6-digit fractional seconds.
   */
  it.each([
    "2026-03-09T13:41:01.202475Z",
    "2025-09-23T13:13:12.088142Z",
    "2024-10-13T10:00:00Z",
    "2026-07-31T00:00:00.000Z",
  ])("accepts the real DADA timestamp %s", fetchAt => {
    expect(() => InterestRateSchema.parse({ ...valid, fetchAt })).not.toThrow();
  });

  it.each(["not-a-date", "2026-01-01", "2026-01-01T00:00:00"])(
    "rejects the malformed timestamp %p",
    fetchAt => {
      expect(() => InterestRateSchema.parse({ ...valid, fetchAt })).toThrow();
    },
  );

  /* currencyId is a union: DADA keys interestRates by crypto ids and token ids alike. */
  it.each(["bitcoin", "ethereum/erc20/usd_tether__erc20_"])("accepts the currency id %s", id => {
    expect(() => InterestRateSchema.parse({ ...valid, currencyId: id })).not.toThrow();
  });

  it("rejects an empty currency id", () => {
    expect(() => InterestRateSchema.parse({ ...valid, currencyId: "" })).toThrow();
  });
});

describe("ApyTypeSchema", () => {
  it.each(["NRR", "APY", "APR"])("accepts %s", type => {
    expect(ApyTypeSchema.parse(type)).toBe(type);
  });

  it.each(["", "apy", "STAKING", "UNKNOWN"])("rejects %p", type => {
    expect(() => ApyTypeSchema.parse(type)).toThrow();
  });
});
