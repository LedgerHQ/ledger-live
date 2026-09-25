import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { StacksMemoTooLong } from "../errors";
import * as logicValidateMemo from "../logic/validateMemo";
import { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

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

  it.each(["delegate", "undelegate", undefined] as const)(
    // The classic bridge's signOperation/createTransaction only ever build a plain transfer, with
    // no pox-5 contract-call support -- recipient validation must stay unconditional (mode included)
    // so a staking-shaped transaction can't fall through and be signed as an ordinary STX transfer.
    "should require recipient regardless of mode (%s)",
    async mode => {
      const account = {
        currency: { name: "" },
        spendableBalance: BigNumber(1000000),
      } as Account;
      const transaction = {
        mode,
        recipient: "",
        amount: BigNumber(100),
        fee: BigNumber(10),
      } as Transaction;

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.recipient).toBeDefined();
    },
  );
});
