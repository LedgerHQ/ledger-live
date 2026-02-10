import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { validateAddress } from "../dfinity/validation";
import { InvalidMemoICP } from "../errors";
import * as logicValidateMemo from "../logic/validateMemo";
import { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../dfinity/validation");
jest.mock("../logic/validateMemo");

describe("getTransactionStatus", () => {
  const spiedValidateMemo = logicValidateMemo.validateMemo as jest.Mock;
  const spiedValidateAddress = jest.mocked(validateAddress);

  beforeEach(() => {
    spiedValidateMemo.mockClear();
    spiedValidateAddress.mockClear();

    spiedValidateAddress.mockResolvedValue({ isValid: true } as never);
  });

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockReturnValueOnce(true);

    const account = {} as Account;
    const transaction = { amount: BigNumber(0), memo: "random memo for unit test" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeDefined();

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockReturnValueOnce(false);

    const account = {} as Account;
    const transaction = { amount: BigNumber(0), memo: "random memo for unit test" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(InvalidMemoICP);

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });
});
