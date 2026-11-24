import BigNumber from "bignumber.js";
import { createTransaction } from "./bridge/createTransaction";
import { buildTransaction, SCHNORR_RECIPIENT } from "./test/fixtures";
import { fromTransactionRaw, toTransactionRaw } from "./transaction";

const populatedNetworkInfo = [
  { label: "slow", amount: new BigNumber(1), estimatedSeconds: 30 },
  { label: "medium", amount: new BigNumber(2), estimatedSeconds: 10 },
  { label: "fast", amount: new BigNumber(5), estimatedSeconds: 1 },
];

describe("kaspa transaction serialization", () => {
  it.each([
    ["an empty transaction", createTransaction()],
    [
      "a transaction with a recipient and an amount",
      buildTransaction({ amount: new BigNumber(500000000), customFeeRate: undefined }),
    ],
    [
      "a transaction with a network info and a custom fee rate",
      buildTransaction({
        feesStrategy: "custom",
        customFeeRate: new BigNumber(7),
        networkInfo: populatedNetworkInfo,
      }),
    ],
    [
      "a transaction with a network info and no custom fee rate",
      buildTransaction({
        feesStrategy: "medium",
        customFeeRate: undefined,
        networkInfo: populatedNetworkInfo,
      }),
    ],
  ])("restores %s through the raw format", (_name, transaction) => {
    expect(fromTransactionRaw(toTransactionRaw(transaction))).toEqual(transaction);
  });

  it("stores the amounts of the network info and the custom fee rate as strings", () => {
    const raw = toTransactionRaw(
      buildTransaction({
        recipient: SCHNORR_RECIPIENT,
        amount: new BigNumber(500000000),
        feesStrategy: "custom",
        customFeeRate: new BigNumber(7),
        networkInfo: populatedNetworkInfo,
      }),
    );

    expect({
      family: raw.family,
      amount: raw.amount,
      feesStrategy: raw.feesStrategy,
      customFeeRate: raw.customFeeRate,
      networkInfo: raw.networkInfo,
    }).toEqual({
      family: "kaspa",
      amount: "500000000",
      feesStrategy: "custom",
      customFeeRate: "7",
      networkInfo: [
        { label: "slow", amount: "1", estimatedSeconds: 30 },
        { label: "medium", amount: "2", estimatedSeconds: 10 },
        { label: "fast", amount: "5", estimatedSeconds: 1 },
      ],
    });
  });

  it("leaves the custom fee rate undefined when it is not set", () => {
    const raw = toTransactionRaw(buildTransaction({ customFeeRate: undefined }));

    expect(raw.customFeeRate).toBeUndefined();
  });
});
