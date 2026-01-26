import BigNumber from "bignumber.js";
import { AlgorandMemoExceededSizeError } from "./errors";
import { getTransactionStatus } from "./getTransactionStatus";
import * as logicValidateMemo from "./logic/validateMemo";
import { AlgorandAccount, Transaction } from "./types";

jest.mock("algosdk", () => ({
  isValidAddress: jest.fn().mockReturnValue(true),
}));

jest.mock("./bridgeLogic", () => {
  const BigNumber = require("bignumber.js").default;
  return {
    computeAlgoMaxSpendable: jest.fn().mockReturnValue(new BigNumber(1000000)),
    isAmountValid: jest.fn().mockResolvedValue(true),
    recipientHasAsset: jest.fn().mockResolvedValue(true),
  };
});
jest.mock("./logic/validateMemo");

describe("getTransactionStatus", () => {
  const spiedValidateMemo = jest.spyOn(logicValidateMemo, "validateMemo");

  beforeEach(() => {
    spiedValidateMemo.mockClear();
  });

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockReturnValue(true);

    const account = {
      algorandResources: { nbAssets: 0, rewards: new BigNumber(0) },
      balance: new BigNumber(1000000),
      freshAddress: "TESTADDRESS",
    } as unknown as AlgorandAccount;
    const transaction = {
      mode: "send",
      fees: new BigNumber(1000),
      amount: new BigNumber(100000),
      recipient: "RECIPIENT",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors).toEqual({});
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockReturnValue(false);

    const account = {
      algorandResources: { nbAssets: 0, rewards: new BigNumber(0) },
      balance: new BigNumber(1000000),
      freshAddress: "TESTADDRESS",
    } as unknown as AlgorandAccount;
    const transaction = {
      mode: "send",
      fees: new BigNumber(1000),
      amount: new BigNumber(100000),
      recipient: "RECIPIENT",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(AlgorandMemoExceededSizeError);
  });
});
