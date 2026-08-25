import BigNumber from "bignumber.js";
import { MICROCREDITS_PER_CREDIT, MIN_STAKE_AMOUNT } from "../constants";
import { estimateGrossRate, estimateNetRate, parseTotalSupply } from "./stakingRate";

/** Credits -> microcredits, so tests read in the unit the ticket quotes. */
const toMicrocredits = (credits: number) =>
  new BigNumber(credits).multipliedBy(MICROCREDITS_PER_CREDIT);

// Observed on mainnet 2026-08-24, quoted in LIVE-32275 as the reference point:
// ~7.8% gross, ~7.0% net at the 10% commission most validators charge.
const MAINNET_TOTAL_SUPPLY_CREDITS = new BigNumber(2_056_277_710);
const MAINNET_TOTAL_STAKE_CREDITS = 1_323_101_922;

describe("parseTotalSupply", () => {
  it("accepts a JSON number", () => {
    expect(parseTotalSupply(2_056_277_710)?.toNumber()).toBe(2_056_277_710);
  });

  it("accepts a numeric string, since the endpoint's scalar form is not guaranteed", () => {
    expect(parseTotalSupply("2056277710")?.toNumber()).toBe(2_056_277_710);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a non-numeric string", "not-a-number"],
    ["an object", { total: 1 }],
    ["an array", [1]],
    ["zero", 0],
    ["a negative supply", -1],
    ["NaN", NaN],
    ["Infinity", Infinity],
  ])("rejects %s", (_label, value) => {
    expect(parseTotalSupply(value)).toBeNull();
  });
});

describe("estimateGrossRate", () => {
  it("matches the rate observed on mainnet", () => {
    const rate = estimateGrossRate(
      MAINNET_TOTAL_SUPPLY_CREDITS,
      toMicrocredits(MAINNET_TOTAL_STAKE_CREDITS),
    );

    expect(rate?.toNumber()).toBeCloseTo(0.0777, 4);
  });

  it("converts microcredits to credits before dividing", () => {
    // Same numbers on the same scale must give 5% — the inflation rate itself.
    // Skipping the conversion would inflate this by 1e6.
    const rate = estimateGrossRate(new BigNumber(1_000), toMicrocredits(1_000));

    expect(rate?.toNumber()).toBe(0.05);
  });

  it.each([
    ["zero total stake", new BigNumber(100), new BigNumber(0)],
    ["negative total stake", new BigNumber(100), new BigNumber(-1)],
    ["zero total supply", new BigNumber(0), new BigNumber(100)],
    ["a non-finite total supply", new BigNumber(NaN), new BigNumber(100)],
    ["a non-finite total stake", new BigNumber(100), new BigNumber(NaN)],
  ])("returns null for %s", (_label, supply, stake) => {
    expect(estimateGrossRate(supply, stake)).toBeNull();
  });
});

describe("estimateNetRate", () => {
  const baseParams = {
    totalSupplyCredits: MAINNET_TOTAL_SUPPLY_CREDITS,
    totalStakeMicrocredits: toMicrocredits(MAINNET_TOTAL_STAKE_CREDITS),
    // Comfortably under the 25% concentration cap.
    validatorStakeMicrocredits: toMicrocredits(10_000_000),
    commissionPercent: new BigNumber(10),
  };

  it("matches the net rate observed on mainnet at 10% commission", () => {
    expect(estimateNetRate(baseParams)?.toNumber()).toBeCloseTo(0.0699, 4);
  });

  it("equals the gross rate at zero commission", () => {
    const net = estimateNetRate({ ...baseParams, commissionPercent: new BigNumber(0) });
    const gross = estimateGrossRate(
      baseParams.totalSupplyCredits,
      baseParams.totalStakeMicrocredits,
    );

    expect(net?.toNumber()).toBe(gross?.toNumber());
  });

  it("returns zero when the validator holds more than 25% of total stake", () => {
    const rate = estimateNetRate({
      ...baseParams,
      validatorStakeMicrocredits: toMicrocredits(MAINNET_TOTAL_STAKE_CREDITS * 0.26),
    });

    expect(rate?.toNumber()).toBe(0);
  });

  it("still pays a validator sitting exactly at the 25% cap", () => {
    const rate = estimateNetRate({
      ...baseParams,
      validatorStakeMicrocredits: toMicrocredits(MAINNET_TOTAL_STAKE_CREDITS * 0.25),
    });

    expect(rate?.toNumber()).toBeGreaterThan(0);
  });

  it("returns zero for a delegator below the protocol minimum", () => {
    const rate = estimateNetRate({
      ...baseParams,
      delegatorStakeMicrocredits: new BigNumber(MIN_STAKE_AMOUNT).minus(1),
    });

    expect(rate?.toNumber()).toBe(0);
  });

  it("pays a delegator sitting exactly at the protocol minimum", () => {
    const rate = estimateNetRate({
      ...baseParams,
      delegatorStakeMicrocredits: new BigNumber(MIN_STAKE_AMOUNT),
    });

    expect(rate?.toNumber()).toBeGreaterThan(0);
  });

  it("ignores the delegator minimum when no delegator stake is given", () => {
    expect(estimateNetRate(baseParams)?.toNumber()).toBeGreaterThan(0);
  });

  it("clamps a commission above 100% to zero instead of going negative", () => {
    const rate = estimateNetRate({ ...baseParams, commissionPercent: new BigNumber(150) });

    expect(rate?.toNumber()).toBe(0);
  });

  it("returns null — not zero — when the rate cannot be derived", () => {
    const rate = estimateNetRate({ ...baseParams, totalStakeMicrocredits: new BigNumber(0) });

    expect(rate).toBeNull();
  });

  it("returns null for a negative commission", () => {
    const rate = estimateNetRate({ ...baseParams, commissionPercent: new BigNumber(-1) });

    expect(rate).toBeNull();
  });
});
