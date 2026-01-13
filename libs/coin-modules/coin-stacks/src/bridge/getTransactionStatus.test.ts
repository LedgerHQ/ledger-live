import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { StacksMemoTooLong } from "../errors";
import { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";
import * as logicValidateMemo from "../logic/validateMemo";

jest.mock("../logic/validateMemo", () => {
  const actual = jest.requireActual("../logic/validateMemo");
  return {
    ...actual,
    validateMemo: jest.fn(actual.validateMemo), // replace with mock
  };
});

describe("getTransactionStatus", () => {
  const spiedValidateMemo = logicValidateMemo.validateMemo as jest.Mock;

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
