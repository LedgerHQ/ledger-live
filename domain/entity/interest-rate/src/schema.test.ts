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
   * fetchAt stays a plain string rather than DateTimeIsoSchema: nothing in the apps reads it, so
   * validating the format could only discard otherwise-good rates.
   */
  it("does not validate the fetchAt format", () => {
    expect(() => InterestRateSchema.parse({ ...valid, fetchAt: "not-a-date" })).not.toThrow();
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
