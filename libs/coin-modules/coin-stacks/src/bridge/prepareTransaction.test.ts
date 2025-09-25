import BigNumber from "bignumber.js";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import { estimateTransaction, estimateTransactionByteLength } from "@stacks/transactions";
import { Transaction } from "../types";
import { validateAddress } from "./utils/addresses";
import { findNextNonce, getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";
import { createTransaction } from "./utils/transactions";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers");
jest.mock("@stacks/transactions");
jest.mock("./utils/addresses");
jest.mock("./utils/misc");
jest.mock("./utils/token");
jest.mock("./utils/transactions");

describe("prepareTransaction", () => {
  let validateAddressSpy: jest.SpyInstance;
  let getAddressSpy: jest.SpyInstance;
  let findNextNonceSpy: jest.SpyInstance;
  let createTransactionSpy: jest.SpyInstance;
  let estimateTransactionSpy: jest.SpyInstance;
  let getSubAccountSpy: jest.SpyInstance;
  let updateTransactionSpy: jest.SpyInstance;

  const mockAccount = {
    address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    spendableBalance: new BigNumber(100000000),
    pendingOperations: [],
    xpub: "xpub123",
  } as unknown as Account;

  const mockTransaction = {
    recipient: "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    useAllAmount: false,
    fee: new BigNumber(0),
    network: "mainnet",
    amount: new BigNumber(1000),
  } as unknown as Transaction;

  const mockTx = {
    auth: {
      spendingCondition: {
        signer: "1234567890abcdef1234567890abcdef12345678",
      },
    },
    payload: {},
  };

  beforeEach(() => {
    validateAddressSpy = jest.spyOn({ validateAddress }, "validateAddress");
    getAddressSpy = jest.spyOn({ getAddress }, "getAddress");
    findNextNonceSpy = jest.spyOn({ findNextNonce }, "findNextNonce");
    createTransactionSpy = jest.spyOn({ createTransaction }, "createTransaction");
    estimateTransactionSpy = jest.spyOn({ estimateTransaction }, "estimateTransaction");
    getSubAccountSpy = jest.spyOn({ getSubAccount }, "getSubAccount");
    updateTransactionSpy = jest.spyOn({ updateTransaction }, "updateTransaction");

    getAddressSpy.mockReturnValue({ address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" });
    validateAddressSpy.mockReturnValue({ isValid: true });
    createTransactionSpy.mockResolvedValue(mockTx);
    estimateTransactionSpy.mockResolvedValue([{ fee: 2000 }]);
    findNextNonceSpy.mockResolvedValue(5);
    getSubAccountSpy.mockReturnValue(null);
    updateTransactionSpy.mockImplementation((tx, patch) => ({ ...tx, ...patch }));
    (estimateTransactionByteLength as jest.Mock).mockReturnValue(200);
  });

  it("should update fee field with estimated fee", async () => {
    const newTx = await prepareTransaction(mockAccount, mockTransaction);
    expect(newTx.fee).toEqual(new BigNumber(2000));
    expect(newTx.nonce).toEqual(5);
  });

  it("should update amount when useAllAmount is true", async () => {
    const txWithUseAllAmount = {
      ...mockTransaction,
      useAllAmount: true,
    } as unknown as Transaction;

    const newTx = await prepareTransaction(mockAccount, txWithUseAllAmount);
    expect(newTx.amount).toEqual(mockAccount.spendableBalance.minus(new BigNumber(2000)));
  });

  it("should update token amount when useAllAmount is true with subaccount", async () => {
    const mockSubAccount = {
      spendableBalance: new BigNumber(50000),
    };
    getSubAccountSpy.mockReturnValue(mockSubAccount);

    const txWithUseAllAmount = {
      ...mockTransaction,
      useAllAmount: true,
    } as unknown as Transaction;

    const newTx = await prepareTransaction(mockAccount, txWithUseAllAmount);
    expect(newTx.amount).toEqual(mockSubAccount.spendableBalance);
  });

  it("should not update fields when recipient address is invalid", async () => {
    validateAddressSpy.mockReturnValue({ isValid: false });

    const newTx = await prepareTransaction(mockAccount, mockTransaction);
    expect(newTx).toEqual(mockTransaction);
  });

  it("should throw error when xpub is missing", async () => {
    const accountWithoutXpub = { ...mockAccount, xpub: undefined } as unknown as Account;

    await expect(prepareTransaction(accountWithoutXpub, mockTransaction)).rejects.toThrow(
      "xpub is required",
    );
  });
});
