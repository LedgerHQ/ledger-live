import {
  ApyFractionSchema,
  BaseUnitAmountSchema,
  EarnInterestTypeSchema,
  EarnPositionIdSchema,
  EarnPositionInterestSchema,
  EarnPositionSchema,
  EarnPositionStatusSchema,
  EarnPositionsSchema,
} from "./schema";

const position = {
  id: "StakeAccountA1111111111111111111111111111111",
  network: "solana",
  ownerAddress: "Wa11etTestAddress1111111111111111111111111111",
  validatorAddress: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
  status: "activated",
};

describe("EarnPositionStatusSchema", () => {
  it("accepts every status the backend sends", () => {
    for (const status of [
      "activated",
      "activating",
      "deactivating",
      "deactivated",
      "archived",
      "unknown",
    ]) {
      expect(EarnPositionStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("rejects any other status", () => {
    expect(EarnPositionStatusSchema.safeParse("active").success).toBe(false);
  });
});

describe("BaseUnitAmountSchema", () => {
  it("accepts a digit string, however long", () => {
    expect(BaseUnitAmountSchema.parse("0")).toBe("0");
    expect(BaseUnitAmountSchema.parse("10000000000")).toBe("10000000000");
    expect(BaseUnitAmountSchema.parse("123456789012345678901234567890")).toBe(
      "123456789012345678901234567890",
    );
  });

  it("turns a safe integer number into its digit string", () => {
    expect(BaseUnitAmountSchema.parse(5_000_000_000)).toBe("5000000000");
    expect(BaseUnitAmountSchema.parse(Number.MAX_SAFE_INTEGER)).toBe("9007199254740991");
  });

  it("rejects a negative amount", () => {
    expect(BaseUnitAmountSchema.safeParse("-1").success).toBe(false);
    expect(BaseUnitAmountSchema.safeParse(-1).success).toBe(false);
  });

  it("rejects an amount that is not an integer", () => {
    expect(BaseUnitAmountSchema.safeParse("1.5").success).toBe(false);
    expect(BaseUnitAmountSchema.safeParse(1.5).success).toBe(false);
    expect(BaseUnitAmountSchema.safeParse("1e9").success).toBe(false);
    expect(BaseUnitAmountSchema.safeParse(" 1").success).toBe(false);
    expect(BaseUnitAmountSchema.safeParse("").success).toBe(false);
  });

  it("rejects a number that has already lost digits", () => {
    expect(BaseUnitAmountSchema.safeParse(2 ** 53).success).toBe(false);
    expect(BaseUnitAmountSchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
    expect(BaseUnitAmountSchema.safeParse(Number.NaN).success).toBe(false);
  });
});

describe("ApyFractionSchema", () => {
  it("accepts a fraction from 0 to 1", () => {
    expect(ApyFractionSchema.parse(0)).toBe(0);
    expect(ApyFractionSchema.parse(0.072)).toBe(0.072);
    expect(ApyFractionSchema.parse(1)).toBe(1);
  });

  it("rejects a percentage, a negative rate and a value that is not a finite number", () => {
    expect(ApyFractionSchema.safeParse(7.2).success).toBe(false);
    expect(ApyFractionSchema.safeParse(-0.01).success).toBe(false);
    expect(ApyFractionSchema.safeParse(Number.NaN).success).toBe(false);
    expect(ApyFractionSchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
    expect(ApyFractionSchema.safeParse("0.072").success).toBe(false);
  });
});

describe("EarnInterestTypeSchema", () => {
  it("accepts every kind of rate the backend reports", () => {
    for (const type of ["APY", "APR", "NRR", "GRR"]) {
      expect(EarnInterestTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("rejects a kind of rate it does not know, whatever its case", () => {
    expect(EarnInterestTypeSchema.safeParse("apy").success).toBe(false);
    expect(EarnInterestTypeSchema.safeParse("Yield").success).toBe(false);
  });
});

describe("EarnPositionInterestSchema", () => {
  it("carries the rate with its kind", () => {
    expect(EarnPositionInterestSchema.parse({ type: "APR", value: 0.068 })).toEqual({
      type: "APR",
      value: 0.068,
    });
  });

  it("accepts a zero rate, which the display decides to hide", () => {
    expect(EarnPositionInterestSchema.safeParse({ type: "APY", value: 0 }).success).toBe(true);
  });

  it("rejects a rate without its kind, or a percentage", () => {
    expect(EarnPositionInterestSchema.safeParse({ value: 0.068 }).success).toBe(false);
    expect(EarnPositionInterestSchema.safeParse({ type: "APY", value: 6.8 }).success).toBe(false);
  });
});

describe("EarnPositionIdSchema", () => {
  it("trims the stake account address", () => {
    expect(EarnPositionIdSchema.parse(` ${position.id} `)).toBe(position.id);
  });

  it("rejects a blank id", () => {
    expect(EarnPositionIdSchema.safeParse("  ").success).toBe(false);
  });
});

describe("EarnPositionSchema", () => {
  it("accepts a position with every optional field absent", () => {
    expect(EarnPositionSchema.safeParse(position).success).toBe(true);
  });

  it("accepts the empty validator address of a stake account that is not delegated", () => {
    expect(EarnPositionSchema.safeParse({ ...position, validatorAddress: "" }).success).toBe(true);
  });

  it("rejects a blank id, network or owner address", () => {
    expect(EarnPositionSchema.safeParse({ ...position, id: "" }).success).toBe(false);
    expect(EarnPositionSchema.safeParse({ ...position, network: "" }).success).toBe(false);
    expect(EarnPositionSchema.safeParse({ ...position, ownerAddress: "" }).success).toBe(false);
  });

  it("rejects a logo that is not an http(s) URL", () => {
    expect(
      EarnPositionSchema.safeParse({ ...position, validatorLogoUrl: "ftp://logo.test/a.png" })
        .success,
    ).toBe(false);
  });

  it("rejects an update time without an offset", () => {
    expect(
      EarnPositionSchema.safeParse({ ...position, updatedAt: "2026-11-18T12:00:00" }).success,
    ).toBe(false);
  });

  it("rejects an amount or a rate the entity cannot carry", () => {
    expect(EarnPositionSchema.safeParse({ ...position, balance: "-5" }).success).toBe(false);
    expect(
      EarnPositionSchema.safeParse({ ...position, interest: { type: "APY", value: 7.2 } }).success,
    ).toBe(false);
  });
});

describe("EarnPositionsSchema", () => {
  it("accepts positions next to the failures a provider reported", () => {
    const result = EarnPositionsSchema.safeParse({
      positions: [position],
      failures: [{ code: 503, reason: "Provider unavailable" }],
      isStale: true,
      respondedAt: "2026-11-18T12:00:01Z",
    });

    expect(result.success).toBe(true);
  });

  it("accepts an address with no position and no failure", () => {
    expect(
      EarnPositionsSchema.safeParse({ positions: [], failures: [], isStale: false }).success,
    ).toBe(true);
  });

  it("rejects a failure without its code", () => {
    expect(
      EarnPositionsSchema.safeParse({
        positions: [],
        failures: [{ reason: "Provider unavailable" }],
        isStale: false,
      }).success,
    ).toBe(false);
  });
});
