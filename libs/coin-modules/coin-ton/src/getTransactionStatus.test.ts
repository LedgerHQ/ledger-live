import { toNano } from "@ton/core";
import BigNumber from "bignumber.js";
import { MINIMUM_REQUIRED_BALANCE } from "./constants";
import { TonCommentInvalid } from "./errors";
import { getTransactionStatus } from "./getTransactionStatus";
import * as logicValidateMemo from "./logic/validateMemo";
import { TonAccount, Transaction } from "./types";

describe("getTransactionStatus", () => {
  const spiedValidateMemo = jest.spyOn(logicValidateMemo, "validateMemo");

  beforeEach(() => {
    spiedValidateMemo.mockClear();
  });

  it("should not set error on transaction when comment is validated", async () => {
    spiedValidateMemo.mockReturnValue(true);

    const account = {
      balance: new BigNumber(toNano(MINIMUM_REQUIRED_BALANCE).toString()),
      currency: { name: "ton" },
    } as TonAccount;
    const transaction = {
      amount: BigNumber(1),
      recipient: "random recipient",
      family: "ton",
      fees: BigNumber(0),
      comment: { text: "random comment for unit test" },
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeDefined();

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.comment);
  });

  it("should set error on transaction when comment is invalidated", async () => {
    spiedValidateMemo.mockReturnValue(false);

    const account = {
      balance: new BigNumber(toNano(MINIMUM_REQUIRED_BALANCE).toString()),
      currency: { name: "ton" },
    } as TonAccount;
    const transaction = {
      amount: BigNumber(1),
      recipient: "random recipient",
      family: "ton",
      fees: BigNumber(0),
      comment: { text: "random comment for unit test" },
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(TonCommentInvalid);

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.comment);
  });
});
