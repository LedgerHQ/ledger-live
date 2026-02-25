import { AlgorandMemoExceededSizeError } from "./errors";
import { getTransactionStatus } from "./getTransactionStatus";
import * as logicValidateMemo from "./logic/validateMemo";
import { AlgorandAccount, Transaction } from "./types";

jest.mock("./logic");
jest.mock("./logic/validateMemo");

describe("getTransactionStatus", () => {
  const spiedValidateMemo = jest.spyOn(logicValidateMemo, "validateMemo");

  beforeEach(() => {
    spiedValidateMemo.mockClear();
  });

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockReturnValue(true);

    const account = { algorandResources: {} } as AlgorandAccount;
    const transaction = {} as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeDefined();
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockReturnValue(false);

    const account = { algorandResources: {} } as AlgorandAccount;
    const transaction = {} as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(AlgorandMemoExceededSizeError);
  });
});
