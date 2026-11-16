import BigNumber from "bignumber.js";
import { buildOptimisticOperation } from "../../bridge/buildOptimisticOperation";
import {
  accountFixture,
  transactionFixture,
  transactionWithUsdcFeeFixture,
} from "../../bridge/fixtures";

describe("buildOptimisticOperation", () => {
  it("should build a proper send operation", () => {
    const optimisticOperation = buildOptimisticOperation(
      accountFixture,
      { ...transactionFixture, mode: "send" },
      BigNumber(2),
      7,
    );

    expect(optimisticOperation.value).toEqual(BigNumber(12));
    expect(optimisticOperation.type).toEqual("OUT");
    expect(optimisticOperation.extra.celoSourceValidator).toEqual(undefined);
  });

  it("leaves a fee paid in a fee currency out of the CELO value", () => {
    const optimisticOperation = buildOptimisticOperation(
      accountFixture,
      transactionWithUsdcFeeFixture,
      BigNumber(2),
      7,
    );

    expect(optimisticOperation.value).toEqual(BigNumber(10));
    expect(optimisticOperation.fee).toEqual(BigNumber(2));
  });

  it("carries the signed nonce as transactionSequenceNumber", () => {
    const optimisticOperation = buildOptimisticOperation(
      accountFixture,
      transactionFixture,
      BigNumber(2),
      7,
    );

    expect(optimisticOperation.transactionSequenceNumber).toEqual(BigNumber(7));
  });

  it("should build a proper vote operation", () => {
    const optimisticOperation = buildOptimisticOperation(
      accountFixture,
      { ...transactionFixture, mode: "vote" },
      BigNumber(2),
      7,
    );

    expect(optimisticOperation.value).toEqual(BigNumber(10));
    expect(optimisticOperation.type).toEqual("VOTE");
    expect(optimisticOperation.extra.celoSourceValidator).toEqual("recipient");
  });

  it("mirrors the transaction's fee currency as a lowercased feeCurrencyAddress", () => {
    const optimisticOperation = buildOptimisticOperation(
      accountFixture,
      {
        ...transactionFixture,
        mode: "send",
        feeCurrency: "0xCEBA9300F2B948710D2653DD7B07F33A8B32118C",
      },
      BigNumber(2),
      7,
    );

    expect(optimisticOperation.extra.feeCurrencyAddress).toEqual(
      "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
    );
  });

  it("leaves feeCurrencyAddress unset when the transaction has no fee currency", () => {
    const optimisticOperation = buildOptimisticOperation(
      accountFixture,
      { ...transactionFixture, mode: "send", feeCurrency: null },
      BigNumber(2),
      7,
    );

    expect(optimisticOperation.extra.feeCurrencyAddress).toBeUndefined();
  });
});
