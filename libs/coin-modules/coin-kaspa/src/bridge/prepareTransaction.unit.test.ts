jest.mock("../network", () => ({ getFeeEstimate: jest.fn() }));

import BigNumber from "bignumber.js";
import { getFeeEstimate } from "../network";
import type { KaspaAccount, Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

const mockedGetFeeEstimate = jest.mocked(getFeeEstimate);

const transaction = (feesStrategy: Transaction["feesStrategy"] = "medium"): Transaction =>
  ({
    family: "kaspa",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    feesStrategy,
    networkInfo: [],
  }) as Transaction;

const feeEstimate = {
  lowBuckets: [{ feerate: 1, estimatedSeconds: 60 }],
  normalBuckets: [{ feerate: 2, estimatedSeconds: 30 }],
  priorityBucket: { feerate: 3, estimatedSeconds: 10 },
};

describe("prepareTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetFeeEstimate.mockResolvedValue(feeEstimate);
  });

  it("should map low, normal, and priority fee buckets to slow, medium, and fast network info", async () => {
    const result = await prepareTransaction({} as KaspaAccount, transaction());

    expect(result.networkInfo).toEqual([
      { label: "slow", amount: new BigNumber(1), estimatedSeconds: 60 },
      { label: "medium", amount: new BigNumber(2), estimatedSeconds: 30 },
      { label: "fast", amount: new BigNumber(3), estimatedSeconds: 10 },
    ]);
  });

  it("should use a fee rate of one when the slow and medium buckets are empty", async () => {
    mockedGetFeeEstimate.mockResolvedValue({
      ...feeEstimate,
      lowBuckets: [],
      normalBuckets: [],
    });

    const result = await prepareTransaction({} as KaspaAccount, transaction());

    expect(result.networkInfo).toEqual([
      { label: "slow", amount: new BigNumber(1), estimatedSeconds: undefined },
      { label: "medium", amount: new BigNumber(1), estimatedSeconds: undefined },
      { label: "fast", amount: new BigNumber(3), estimatedSeconds: 10 },
    ]);
  });

  it("should select fast when every estimated confirmation time is equal", async () => {
    mockedGetFeeEstimate.mockResolvedValue({
      lowBuckets: [{ feerate: 1, estimatedSeconds: 10 }],
      normalBuckets: [{ feerate: 2, estimatedSeconds: 10 }],
      priorityBucket: { feerate: 3, estimatedSeconds: 10 },
    });

    const result = await prepareTransaction({} as KaspaAccount, transaction("medium"));

    expect(result.feesStrategy).toBe("fast");
  });

  it("should preserve a custom fee strategy when every estimated confirmation time is equal", async () => {
    mockedGetFeeEstimate.mockResolvedValue({
      lowBuckets: [{ feerate: 1, estimatedSeconds: 10 }],
      normalBuckets: [{ feerate: 2, estimatedSeconds: 10 }],
      priorityBucket: { feerate: 3, estimatedSeconds: 10 },
    });

    const result = await prepareTransaction({} as KaspaAccount, transaction("custom"));

    expect(result.feesStrategy).toBe("custom");
  });
});
