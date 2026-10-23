import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { Transaction, TransactionStatus } from "./types";

const account = {
  type: "Account",
  currency: getCryptoCurrencyById("cosmos"),
  freshAddress: "cosmos1sender",
} as unknown as Account;

const status = {
  amount: new BigNumber(1000),
  estimatedFees: new BigNumber(500),
} as unknown as TransactionStatus;

const memoField = async (transaction: Partial<Transaction>) => {
  const fields = await getDeviceTransactionConfig({
    account,
    parentAccount: null,
    transaction: { amount: new BigNumber(1000), ...transaction } as Transaction,
    status,
  });
  return fields.find(field => field.label === "Memo");
};

describe("getDeviceTransactionConfig memo", () => {
  it("lists the memo a generic send carries in memoValue", async () => {
    expect(
      await memoField({ mode: "send", memo: undefined, memoType: "text", memoValue: "invoice 42" }),
    ).toEqual({ type: "text", label: "Memo", value: "invoice 42" });
  });

  it("lists the legacy memo field", async () => {
    expect(await memoField({ mode: "send", memo: "legacy memo" })).toMatchObject({
      value: "legacy memo",
    });
  });

  it("lists no memo for a send without one", async () => {
    expect(await memoField({ mode: "send", memo: null, memoValue: null })).toBeUndefined();
  });

  it("lists the default memo of a staking transaction the user gave none to", async () => {
    expect(
      await memoField({ mode: "delegate", valAddress: "cosmosvaloper1validator", memo: null }),
    ).toMatchObject({ value: "Ledger Live" });
  });

  it("lists the memo the user typed on a staking transaction", async () => {
    expect(
      await memoField({
        mode: "delegate",
        valAddress: "cosmosvaloper1validator",
        memoType: "text",
        memoValue: "my memo",
      }),
    ).toMatchObject({ value: "my memo" });
  });
});
