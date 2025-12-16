import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { StacksMemoTooLong } from "../errors";
import * as logicValidateMemo from "../logic/validateMemo";
import { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

describe("getTransactionStatus", () => {
  const spiedValidateMemo = jest.spyOn(logicValidateMemo, "validateMemo");

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockReturnValueOnce(true);

    const account = { currency: { name: "" } } as Account;
    const transaction = { amount: BigNumber(1), memo: "random memo for unit test" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeDefined();

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockReturnValueOnce(false);

    const account = { currency: { name: "" } } as Account;
    const transaction = { amount: BigNumber(1), memo: "random memo for unit test" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(StacksMemoTooLong);

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });
});
