import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { Transaction, TransactionStatus } from "./types";

function makeInput({
  amount = new BigNumber(0),
  estimatedFees = new BigNumber(0),
  tag = undefined,
}: {
  amount?: BigNumber;
  estimatedFees?: BigNumber;
  tag?: number | null | undefined;
}) {
  return {
    account: {} as never,
    parentAccount: null,
    transaction: { tag } as Transaction,
    status: { amount, estimatedFees } as TransactionStatus,
  };
}

describe("getDeviceTransactionConfig", () => {
  it("returns no fields when amount and fees are zero and tag is not a number", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        amount: new BigNumber(0),
        estimatedFees: new BigNumber(0),
        tag: null,
      }),
    );

    expect(fields).toEqual([]);
  });

  it("returns amount and fees fields when both are non-zero", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        amount: new BigNumber(1),
        estimatedFees: new BigNumber(2),
      }),
    );

    expect(fields).toEqual([
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("returns tag text field when tag is a number", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        tag: 12345,
      }),
    );

    expect(fields).toEqual([{ type: "text", label: "Tag", value: "12345" }]);
  });

  it("includes tag when tag is 0", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        tag: 0,
      }),
    );

    expect(fields).toEqual([{ type: "text", label: "Tag", value: "0" }]);
  });
});
