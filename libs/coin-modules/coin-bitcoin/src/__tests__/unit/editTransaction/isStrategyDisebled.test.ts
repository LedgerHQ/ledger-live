import { BigNumber } from "bignumber.js";
import { isStrategyDisabled } from "../../../editTransaction/isStrategyDisabled";

describe("isStrategyDisabled", () => {
  it("should return true if the strategy's fee rate is lower than the minimum fee rate", () => {
    const transaction = {
      rbf: true,
      feePerByte: new BigNumber(100),
    } as any;
    const feesStrategy = new BigNumber(90);
    expect(isStrategyDisabled({ transaction, feesStrategy })).toBe(true);
  });

  it("should return false if the strategy's fee rate is higher than the minimum fee rate", () => {
    const transaction = {
      rbf: true,
      feePerByte: new BigNumber(1200000000),
    } as any;
    const feesStrategy = new BigNumber(1320000000);
    expect(isStrategyDisabled({ transaction, feesStrategy })).toBe(false);
  });

  it("should return true if RBF is explicitly disabled,", () => {
    const transaction = {
      rbf: false,
      feePerByte: new BigNumber("100000000"),
    } as any;
    const feesStrategy = new BigNumber(150000000);
    expect(isStrategyDisabled({ transaction, feesStrategy })).toBe(true);
  });

  it("should return true if feePerByte is less than or equal to 0", () => {
    const transaction = {
      rbf: true,
      feePerByte: new BigNumber("100"),
    } as any;
    const feesStrategy = new BigNumber(0);
    expect(isStrategyDisabled({ transaction, feesStrategy })).toBe(true);
  });
});
