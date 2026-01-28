import { prepareTransaction } from "./prepareTransaction";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import BigNumber from "bignumber.js";
import { validateAddress, isFilEthAddress, isEthereumConvertableAddr } from "../network";
import { getAddress, getSubAccount } from "../common-logic/utils";
import { fetchEstimatedFees } from "../api/index";

jest.mock("../network", () => ({
  validateAddress: jest.fn(),
  isFilEthAddress: jest.fn(),
  isEthereumConvertableAddr: jest.fn(),
  convertAddressFilToEth: jest.fn(addr => addr),
}));

jest.mock("../common-logic/utils", () => ({
  getAddress: jest.fn(),
  getSubAccount: jest.fn(),
}));

jest.mock("../api/index", () => ({
  fetchEstimatedFees: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers", () => ({
  updateTransaction: jest.fn((tx, patch) => ({ ...tx, ...patch })),
}));

jest.mock("../erc20/tokenAccounts", () => ({
  generateTokenTxnParams: jest.fn(() => "mockedParams"),
  encodeTxnParams: jest.fn(() => "encodedParams"),
}));

const mockedValidateAddress = validateAddress as jest.MockedFunction<typeof validateAddress>;
const mockedIsFilEthAddress = isFilEthAddress as jest.MockedFunction<typeof isFilEthAddress>;
const mockedGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;
const mockedGetSubAccount = getSubAccount as jest.MockedFunction<typeof getSubAccount>;
const mockedFetchEstimatedFees = fetchEstimatedFees as jest.MockedFunction<
  typeof fetchEstimatedFees
>;
const mockedIsEthereumConvertableAddr = isEthereumConvertableAddr as jest.MockedFunction<
  typeof isEthereumConvertableAddr
>;

describe("prepareTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAddress.mockReturnValue({ address: "f1sender", derivationPath: "m/44'/461'/0'/0/0" });
    mockedGetSubAccount.mockReturnValue(null);
    mockedIsFilEthAddress.mockReturnValue(false);
    mockedIsEthereumConvertableAddr.mockReturnValue(false);
  });

  const mockAccount: Account = {
    id: "js:2:filecoin:f1sender:filecoin",
    type: "Account",
    freshAddress: "f1sender",
    balance: new BigNumber("10000000000000000000"),
    spendableBalance: new BigNumber("10000000000000000000"),
    currency: {
      id: "filecoin",
      name: "Filecoin",
      ticker: "FIL",
    },
  } as Account;

  const mockTransaction: Transaction = {
    family: "filecoin",
    amount: new BigNumber("1000000000000000000"),
    method: 0,
    version: 0,
    nonce: 0,
    gasLimit: new BigNumber("0"),
    gasFeeCap: new BigNumber("0"),
    gasPremium: new BigNumber("0"),
    recipient: "f1recipient",
    useAllAmount: false,
  };

  it("should prepare transaction with gas estimates", async () => {
    mockedValidateAddress.mockReturnValue({
      isValid: true,
      parsedAddress: { toString: () => "f1parsed" },
    } as never);
    mockedFetchEstimatedFees.mockResolvedValue({
      gas_fee_cap: "100000",
      gas_limit: 1000000,
      gas_premium: "50000",
      nonce: 5,
    });

    const result = await prepareTransaction(mockAccount, mockTransaction);

    expect(result.gasFeeCap).toEqual(new BigNumber("100000"));
    expect(result.gasPremium).toEqual(new BigNumber("50000"));
    expect(result.gasLimit).toEqual(new BigNumber("1000000"));
    expect(result.nonce).toBe(5);
    expect(result.method).toBe(0); // Transfer method
  });

  it("should return original transaction when recipient is empty", async () => {
    const txNoRecipient: Transaction = { ...mockTransaction, recipient: "" };

    const result = await prepareTransaction(mockAccount, txNoRecipient);

    expect(result).toEqual(txNoRecipient);
    expect(mockedFetchEstimatedFees).not.toHaveBeenCalled();
  });

  it("should return original transaction when recipient is invalid", async () => {
    mockedValidateAddress.mockImplementation(addr => {
      if (addr === "f1recipient") return { isValid: false };
      return { isValid: true, parsedAddress: { toString: () => "f1parsed" } } as never;
    });

    const result = await prepareTransaction(mockAccount, mockTransaction);

    expect(result).toEqual(mockTransaction);
  });

  it("should use InvokeEVM method for f4 address recipient", async () => {
    mockedValidateAddress.mockReturnValue({
      isValid: true,
      parsedAddress: { toString: () => "f410ftest" },
    } as never);
    mockedIsFilEthAddress.mockReturnValue(true);
    mockedFetchEstimatedFees.mockResolvedValue({
      gas_fee_cap: "100000",
      gas_limit: 1000000,
      gas_premium: "50000",
      nonce: 5,
    });

    const result = await prepareTransaction(mockAccount, mockTransaction);

    expect(result.method).toBe(3844450837); // InvokeEVM method
  });

  it("should handle useAllAmount for native transfer", async () => {
    mockedValidateAddress.mockReturnValue({
      isValid: true,
      parsedAddress: { toString: () => "f1parsed" },
    } as never);
    mockedFetchEstimatedFees.mockResolvedValue({
      gas_fee_cap: "100000",
      gas_limit: 1000000,
      gas_premium: "50000",
      nonce: 5,
    });

    const txUseAllAmount: Transaction = { ...mockTransaction, useAllAmount: true };

    const result = await prepareTransaction(mockAccount, txUseAllAmount);

    // amount = balance - fees (calculated by calculateEstimatedFees)
    expect(result.amount.gt(0)).toBe(true);
    expect(result.amount.lt(mockAccount.balance)).toBe(true);
  });

  it("should prepare token transfer transaction", async () => {
    const mockTokenAccount: TokenAccount = {
      id: "js:2:filecoin:f1sender:filecoin+erc20:contract",
      type: "TokenAccount",
      spendableBalance: new BigNumber("5000000000000000000"),
      token: {
        id: "filecoin/erc20/contract",
        name: "TestToken",
        contractAddress: "0x1234567890123456789012345678901234567890",
      },
    } as TokenAccount;

    mockedGetSubAccount.mockReturnValue(mockTokenAccount);
    mockedValidateAddress.mockReturnValue({
      isValid: true,
      parsedAddress: { toString: () => "f410fcontract" },
    } as never);
    mockedIsEthereumConvertableAddr.mockReturnValue(true);
    mockedFetchEstimatedFees.mockResolvedValue({
      gas_fee_cap: "100000",
      gas_limit: 2000000,
      gas_premium: "50000",
      nonce: 5,
    });

    const txWithSubAccount: Transaction = {
      ...mockTransaction,
      subAccountId: mockTokenAccount.id,
    };

    const result = await prepareTransaction(mockAccount, txWithSubAccount);

    expect(result.method).toBe(3844450837); // InvokeEVM method for token transfers
    expect(result.params).toBeDefined();
  });
});
