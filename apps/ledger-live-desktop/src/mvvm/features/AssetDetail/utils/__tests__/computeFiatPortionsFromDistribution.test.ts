import BigNumber from "bignumber.js";
import { computeFiatPortionsFromDistribution } from "../computeFiatPortionsFromDistribution";

describe("computeFiatPortionsFromDistribution", () => {
  it("returns zero fiat when countervalue is missing", () => {
    const result = computeFiatPortionsFromDistribution(
      { amount: 100, countervalue: undefined },
      new BigNumber(40),
      new BigNumber(60),
    );

    expect(result.availableFiat.toNumber()).toBe(0);
    expect(result.earnDepositFiat.toNumber()).toBe(0);
  });

  it("splits countervalue proportionally to crypto balances", () => {
    const result = computeFiatPortionsFromDistribution(
      { amount: 16, countervalue: 160_000 },
      new BigNumber(10),
      new BigNumber(6),
    );

    expect(result.availableFiat.toNumber()).toBe(100_000);
    expect(result.earnDepositFiat.toNumber()).toBe(60_000);
  });

  it("uses available plus earn deposit as denominator when amount is zero", () => {
    const result = computeFiatPortionsFromDistribution(
      { amount: 0, countervalue: 20_000 },
      new BigNumber(4),
      new BigNumber(6),
    );

    expect(result.availableFiat.toNumber()).toBe(8_000);
    expect(result.earnDepositFiat.toNumber()).toBe(12_000);
  });
});
