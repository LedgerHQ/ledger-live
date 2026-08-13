import { ApySchema, ApyTypeSchema, InterestRateSchema } from "./schema";

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
    for (const key of ["currencyId", "rate", "type"] as const) {
      const { [key]: _omitted, ...rest } = valid;
      expect(() => InterestRateSchema.parse(rest)).toThrow();
    }
  });

  /* Nothing reads fetchAt, so its absence must not cost an otherwise usable rate. */
  it("accepts a rate with no fetchAt", () => {
    const { fetchAt: _omitted, ...rest } = valid;
    expect(() => InterestRateSchema.parse(rest)).not.toThrow();
  });

  it("throws when rate is not a number", () => {
    expect(() => InterestRateSchema.parse({ ...valid, rate: "4.2" })).toThrow();
  });

  it("accepts a rate type outside the ApyType union", () => {
    expect(() => InterestRateSchema.parse({ ...valid, type: "STAKING" })).not.toThrow();
  });

  it.each(["not-a-date", "2026-07-31", "2026-07-31T00:00:00"])(
    "rejects %p as fetchAt, which needs an offset",
    fetchAt => {
      expect(() => InterestRateSchema.parse({ ...valid, fetchAt })).toThrow();
    },
  );

  it("accepts a token id, not just a crypto one", () => {
    expect(
      InterestRateSchema.parse({ ...valid, currencyId: "ethereum/erc20/usd_tether" }),
    ).toMatchObject({ currencyId: "ethereum/erc20/usd_tether" });
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

describe("ApySchema", () => {
  it("accepts a rate the apps can render", () => {
    expect(ApySchema.parse({ value: 0.0425, type: "APY" })).toEqual({ value: 0.0425, type: "APY" });
  });

  it.each([0, -0.01, 1, 12.5])("accepts the value %p", value => {
    expect(ApySchema.parse({ value, type: "APR" }).value).toBe(value);
  });

  /*
   * The narrowing is the point of this type: InterestRateSchema keeps `type` a plain string because
   * DADA sends kinds the apps do not render, and this is the shape after those have been dropped.
   */
  it("rejects a rate type the apps cannot render", () => {
    expect(() => ApySchema.parse({ value: 0.04, type: "STAKING" })).toThrow();
  });

  it.each([
    ["a missing value", { type: "APY" }],
    ["a missing type", { value: 0.04 }],
    ["a value that is not a number", { value: "0.04", type: "APY" }],
  ])("rejects %s", (_label, input) => {
    expect(() => ApySchema.parse(input)).toThrow();
  });

  it("is not the wire shape — it has no currencyId or fetchAt", () => {
    const parsed = ApySchema.parse({
      value: 0.04,
      type: "APY",
      currencyId: "bitcoin",
      fetchAt: "2026-08-07",
    });

    expect(parsed).toEqual({ value: 0.04, type: "APY" });
  });
});
