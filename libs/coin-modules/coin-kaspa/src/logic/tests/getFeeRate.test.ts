import { BigNumber } from "bignumber.js";
import { Transaction } from "../../types";
import { getFeeRate } from "../getFeeRate";

describe("getFeeRate", () => {
  it("should return 0 for null transaction", () => {
    const result = getFeeRate(null);
    expect(result.toNumber()).toBe(0);
  });

  it("should return custom fee rate when feesStrategy is 'custom'", () => {
    const transaction: Transaction = {
      family: "kaspa",
      feesStrategy: "custom",
      customFeeRate: new BigNumber(123),
      amount: new BigNumber(0),
      recipient: "recipient_placeholder",
      networkInfo: [{ label: "custom", amount: new BigNumber(123), estimatedSeconds: 10 }],
    };

    const result = getFeeRate(transaction);
    expect(result.toNumber()).toBe(123);
  });

  it("should return custom fee rate when feesStrategy is 'custom', default value", () => {
    const transaction: Transaction = {
      family: "kaspa",
      feesStrategy: "custom",
      amount: new BigNumber(0),
      recipient: "recipient_placeholder",
      networkInfo: [{ label: "custom", amount: new BigNumber(123), estimatedSeconds: 10 }],
    };

    const result = getFeeRate(transaction);
    expect(result.toNumber()).toBe(0);
  });

  it("should return custom fee rate when feesStrategy is 'fast'", () => {
    const transaction: Transaction = {
      family: "kaspa",
      feesStrategy: "fast",
      customFeeRate: new BigNumber(123),
      amount: new BigNumber(0),
      recipient: "recipient_placeholder",
      networkInfo: [{ label: "fast", amount: new BigNumber(123), estimatedSeconds: 10 }],
    };

    const result = getFeeRate(transaction);
    expect(result.toNumber()).toBe(123);
  });

  it("should return custom fee rate when feesStrategy is 'fast'", () => {
    const transaction: Transaction = {
      family: "kaspa",
      feesStrategy: "fast",
      customFeeRate: new BigNumber(123),
      amount: new BigNumber(0),
      recipient: "recipient_placeholder",
      networkInfo: [],
    };

    expect(() => getFeeRate(transaction)).toThrow("Invalid fee strategy provided");
  });
});
