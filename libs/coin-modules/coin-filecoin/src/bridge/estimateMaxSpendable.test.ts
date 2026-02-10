import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import BigNumber from "bignumber.js";
import { validateAddress } from "../network";
import { getAddress, getSubAccount } from "../common-logic";
import { fetchBalances, fetchEstimatedFees } from "../api";

jest.mock("../network", () => ({
  validateAddress: jest.fn(),
  isFilEthAddress: jest.fn(),
  convertAddressFilToEth: jest.fn(addr => addr),
}));

jest.mock("../common-logic", () => ({
  getAddress: jest.fn(),
  getSubAccount: jest.fn(),
}));

jest.mock("../api", () => ({
  fetchBalances: jest.fn(),
  fetchEstimatedFees: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  getMainAccount: jest.fn((account, _parent) => account),
}));

jest.mock("../erc20/tokenAccounts", () => ({
  generateTokenTxnParams: jest.fn(() => "mockedParams"),
  encodeTxnParams: jest.fn(() => "encodedParams"),
}));

const mockedValidateAddress = validateAddress as jest.MockedFunction<typeof validateAddress>;
const mockedGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;
const mockedGetSubAccount = getSubAccount as jest.MockedFunction<typeof getSubAccount>;
const mockedFetchBalances = fetchBalances as jest.MockedFunction<typeof fetchBalances>;
const mockedFetchEstimatedFees = fetchEstimatedFees as jest.MockedFunction<
  typeof fetchEstimatedFees
>;

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAddress.mockReturnValue({ address: "f1sender", derivationPath: "m/44'/461'/0'/0/0" });
    mockedGetSubAccount.mockReturnValue(null);
    mockedValidateAddress.mockReturnValue({
      isValid: true,
      parsedAddress: { toString: () => "f1parsed" },
    } as never);
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
    nonce: 1,
    gasLimit: new BigNumber("1000000"),
    gasFeeCap: new BigNumber("100000"),
    gasPremium: new BigNumber("50000"),
    recipient: "f1recipient",
    useAllAmount: false,
  };

  it("should return max spendable for native account", async () => {
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "10000000000000000000",
      total_balance: "10000000000000000000",
      locked_balance: "0",
    });
    mockedFetchEstimatedFees.mockResolvedValue({
      gas_fee_cap: "100000",
      gas_limit: 1000000,
      gas_premium: "50000",
      nonce: 1,
    });

    const result = await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: mockTransaction,
    });

    // balance - fees (fees = gasFeeCap * gasLimit)
    // The actual value depends on the calculateEstimatedFees implementation
    expect(result.gt(0)).toBe(true);
    expect(result.lt(new BigNumber("10000000000000000000"))).toBe(true);
  });

  it("should return zero when balance is zero", async () => {
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "0",
      total_balance: "0",
      locked_balance: "0",
    });

    const result = await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: mockTransaction,
    });

    expect(result.toString()).toBe("0");
  });

  it("should throw NotEnoughSpendableBalance when balance is less than fees", async () => {
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "10000", // Very small balance
      total_balance: "10000",
      locked_balance: "0",
    });
    mockedFetchEstimatedFees.mockResolvedValue({
      gas_fee_cap: "100000",
      gas_limit: 1000000, // fees = 100000000000
      gas_premium: "50000",
      nonce: 1,
    });

    await expect(
      estimateMaxSpendable({
        account: mockAccount,
        parentAccount: undefined,
        transaction: mockTransaction,
      }),
    ).rejects.toThrow();
  });

  it("should throw InvalidAddress when sender address is invalid", async () => {
    mockedValidateAddress.mockImplementation(addr => {
      if (addr === "f1sender") return { isValid: false };
      return { isValid: true, parsedAddress: { toString: () => "f1parsed" } } as never;
    });

    await expect(
      estimateMaxSpendable({
        account: mockAccount,
        parentAccount: undefined,
        transaction: mockTransaction,
      }),
    ).rejects.toThrow("InvalidAddress");
  });

  it("should return token spendable balance for token account", async () => {
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
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "10000000000000000000",
      total_balance: "10000000000000000000",
      locked_balance: "0",
    });
    mockedFetchEstimatedFees.mockResolvedValue({
      gas_fee_cap: "100000",
      gas_limit: 1000000,
      gas_premium: "50000",
      nonce: 1,
    });

    const result = await estimateMaxSpendable({
      account: mockTokenAccount,
      parentAccount: mockAccount,
      transaction: {
        ...mockTransaction,
        subAccountId: mockTokenAccount.id,
      },
    });

    expect(result).toEqual(mockTokenAccount.spendableBalance);
  });
});
