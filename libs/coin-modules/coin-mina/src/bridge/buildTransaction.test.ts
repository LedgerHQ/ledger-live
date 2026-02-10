import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getAccountNumFromPath } from "../common-logic";
import { MINA_MAINNET_NETWORK_ID, MINA_PAYMENT_TYPE_ID } from "../consts";
import { Transaction } from "../types";
import { buildTransaction } from "./buildTransaction";
jest.mock("../common-logic");

describe("buildTransaction", () => {
  let getAccountNumSpy: jest.SpyInstance;

  beforeEach(() => {
    getAccountNumSpy = jest.spyOn({ getAccountNumFromPath }, "getAccountNumFromPath");
    getAccountNumSpy.mockReturnValue(42); // Mock account number
  });

  const mockAccount: Partial<Account> = {
    freshAddress: "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdHm8qSqZhhtiu1Dq56Cmuo2aJ4",
    freshAddressPath: "44'/12586'/0'/0/0",
  };

  const mockTransaction: Transaction = {
    recipient: "B62qoDWfBZUxKpaoQCoMPJEysXXWv7reVgo7CEAjqx1xAYs3CsT8Gtz",
    amount: new BigNumber(1000000000),
    fees: {
      fee: new BigNumber(1000000),
      accountCreationFee: new BigNumber(0),
    },
    nonce: 5,
    memo: "test transaction",
    family: "mina",
  };

  it("should build a transaction correctly", async () => {
    const result = await buildTransaction(mockAccount as Account, mockTransaction);

    expect(result).toEqual({
      txType: MINA_PAYMENT_TYPE_ID,
      senderAccount: 42,
      senderAddress: mockAccount.freshAddress,
      receiverAddress: mockTransaction.recipient,
      amount: mockTransaction.amount.toNumber(),
      fee: mockTransaction.fees.fee.toNumber(),
      nonce: mockTransaction.nonce,
      memo: mockTransaction.memo,
      networkId: MINA_MAINNET_NETWORK_ID,
    });

    expect(getAccountNumFromPath).toHaveBeenCalledWith(mockAccount.freshAddressPath);
  });

  it("should handle empty memo", async () => {
    const txWithoutMemo = {
      ...mockTransaction,
      memo: undefined,
    };

    const result = await buildTransaction(mockAccount as Account, txWithoutMemo);

    expect(result.memo).toBe("");
  });

  it("should throw error if accountNum is undefined", async () => {
    getAccountNumSpy.mockReturnValue(undefined);

    await expect(buildTransaction(mockAccount as Account, mockTransaction)).rejects.toThrow();
  });
});
