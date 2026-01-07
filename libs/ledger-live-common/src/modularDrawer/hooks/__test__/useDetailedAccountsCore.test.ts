/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useDetailedAccountsCore } from "../useDetailedAccountsCore";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

// Mock the calculate function
jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  calculate: jest.fn(),
}));

// Mock the derivation function
jest.mock("@ledgerhq/coin-framework/derivation", () => ({
  getTagDerivationMode: jest.fn(() => "native_segwit"),
}));

// Import the mocked functions
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
const mockCalculate = calculate as jest.MockedFunction<typeof calculate>;
const mockGetTagDerivationMode = getTagDerivationMode as jest.MockedFunction<
  typeof getTagDerivationMode
>;

describe("useDetailedAccountsCore", () => {
  const mockCounterValuesState = {} as CounterValuesState;
  const mockCounterValueCurrency = {
    id: "usd",
    ticker: "USD",
    units: [{ name: "USD", code: "USD", magnitude: 2 }],
  } as Currency;

  const mockAccount = {
    id: "account1",
    type: "Account",
    currency: {
      id: "ethereum",
      ticker: "ETH",
      name: "Ethereum",
      units: [{ name: "Ethereum", code: "ETH", magnitude: 18 }],
    },
    balance: new BigNumber("1000000000000000000"), // 1 ETH
    freshAddress: "0x123...abc",
    derivationMode: "ethM",
  } as Account;

  const mockTokenAccount = {
    id: "token1",
    type: "TokenAccount",
    parentId: "account1",
    token: {
      id: "usdc",
      ticker: "USDC",
      name: "USD Coin",
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
      parentCurrency: mockAccount.currency,
    },
    balance: new BigNumber("1000000"), // 1 USDC
  } as TokenAccount;

  beforeEach(() => {
    mockCalculate.mockClear();
  });

  it("should calculate fiat value correctly", () => {
    mockCalculate.mockReturnValue(2500); // Mock fiat value

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const fiatValue = result.current.calculateFiatValue(mockAccount);

    expect(mockCalculate).toHaveBeenCalledWith(mockCounterValuesState, {
      from: mockAccount.currency,
      to: mockCounterValueCurrency,
      value: mockAccount.balance.toNumber(),
    });
    expect(fiatValue).toBe(2500);
  });

  it("should return 0 when mockCalculate returns null", () => {
    mockCalculate.mockReturnValue(null);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const fiatValue = result.current.calculateFiatValue(mockAccount);
    expect(fiatValue).toBe(0);
  });

  it("should create base detailed accounts for regular accounts", () => {
    mockCalculate.mockReturnValue(2500);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: null }];
    const accountNameMap = { account1: "My Ethereum Account" };

    const detailedAccounts = result.current.createBaseDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts).toHaveLength(1);
    expect(detailedAccounts[0]).toEqual({
      id: "account1",
      name: "My Ethereum Account",
      ticker: "ETH",
      balance: mockAccount.balance,
      balanceUnit: mockAccount.currency.units[0],
      fiatValue: 2500,
      address: "0x123...abc",
      cryptoId: "ethereum",
    });
  });

  it("should create base detailed accounts for token accounts", () => {
    mockCalculate.mockReturnValue(1); // 1 USD for USDC

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: mockTokenAccount }];
    const accountNameMap = { account1: "My Ethereum Account" };

    const detailedAccounts = result.current.createBaseDetailedAccounts({
      asset: mockTokenAccount.token,
      accountTuples,
      accountNameMap,
      isTokenCurrency: true,
    });

    expect(detailedAccounts).toHaveLength(1);
    expect(detailedAccounts[0]).toEqual({
      id: "token1",
      name: "My Ethereum Account",
      ticker: "USDC",
      balance: mockTokenAccount.balance,
      balanceUnit: mockTokenAccount.token.units[0],
      fiatValue: 1,
      address: "0x123...abc",
      cryptoId: "usdc",
      parentId: "ethereum",
    });
  });

  it("should create extended detailed accounts with account references", () => {
    mockCalculate.mockReturnValue(2500);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: null }];
    const accountNameMap = { account1: "My Ethereum Account" };

    const detailedAccounts = result.current.createExtendedDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts).toHaveLength(1);
    expect(detailedAccounts[0]).toEqual({
      id: "account1",
      name: "My Ethereum Account",
      ticker: "ETH",
      balance: mockAccount.balance,
      balanceUnit: mockAccount.currency.units[0],
      fiatValue: 2500,
      address: "0x123...abc",
      cryptoId: "ethereum",
      account: mockAccount,
      protocol: "native_segwit",
    });
  });

  it("should sort accounts by fiat value in descending order", () => {
    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const mockAccount2 = { ...mockAccount, id: "account2" };

    // Mock different fiat values for different accounts
    mockCalculate
      .mockReturnValueOnce(1000) // First account
      .mockReturnValueOnce(5000); // Second account

    const accountTuples = [
      { account: mockAccount, subAccount: null },
      { account: mockAccount2, subAccount: null },
    ];
    const accountNameMap = {
      account1: "Account 1",
      account2: "Account 2",
    };

    const detailedAccounts = result.current.createBaseDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts).toHaveLength(2);
    expect(detailedAccounts[0].id).toBe("account2"); // Higher fiat value (5000)
    expect(detailedAccounts[1].id).toBe("account1"); // Lower fiat value (1000)
  });

  it("should use fallback name when account name is not in map", () => {
    mockCalculate.mockReturnValue(2500);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: null }];
    const accountNameMap = {}; // Empty map

    const detailedAccounts = result.current.createBaseDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts[0].name).toBe("Ethereum"); // Falls back to currency name
  });

  it("should handle token accounts with extended detailed accounts", () => {
    mockCalculate.mockReturnValue(1); // 1 USD for USDC

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: mockTokenAccount }];
    const accountNameMap = { account1: "My Ethereum Account" };

    const detailedAccounts = result.current.createExtendedDetailedAccounts({
      asset: mockTokenAccount.token,
      accountTuples,
      accountNameMap,
      isTokenCurrency: true,
    });

    expect(detailedAccounts).toHaveLength(1);
    expect(detailedAccounts[0]).toEqual({
      id: "token1",
      name: "My Ethereum Account",
      ticker: "USDC",
      balance: mockTokenAccount.balance,
      balanceUnit: mockTokenAccount.token.units[0],
      fiatValue: 1,
      address: "0x123...abc",
      cryptoId: "usdc",
      parentId: "ethereum",
      account: mockTokenAccount,
      parentAccount: mockAccount,
    });
  });

  it("should handle multiple accounts with mixed fiat values including zero", () => {
    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const mockAccount2 = { ...mockAccount, id: "account2" };
    const mockAccount3 = { ...mockAccount, id: "account3" };

    // Mock different fiat values including zero
    mockCalculate
      .mockReturnValueOnce(0) // First account - zero value
      .mockReturnValueOnce(5000) // Second account - high value
      .mockReturnValueOnce(100); // Third account - low value

    const accountTuples = [
      { account: mockAccount, subAccount: null },
      { account: mockAccount2, subAccount: null },
      { account: mockAccount3, subAccount: null },
    ];
    const accountNameMap = {
      account1: "Account 1",
      account2: "Account 2",
      account3: "Account 3",
    };

    const detailedAccounts = result.current.createBaseDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts).toHaveLength(3);
    // Should be sorted by fiat value descending: 5000, 100, 0
    expect(detailedAccounts[0].id).toBe("account2"); // 5000
    expect(detailedAccounts[1].id).toBe("account3"); // 100
    expect(detailedAccounts[2].id).toBe("account1"); // 0
    expect(detailedAccounts[2].fiatValue).toBe(0);
  });

  it("should handle token account fiat value calculation correctly", () => {
    mockCalculate.mockReturnValue(50); // Mock fiat value for token

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const fiatValue = result.current.calculateFiatValue(mockTokenAccount);

    expect(mockCalculate).toHaveBeenCalledWith(mockCounterValuesState, {
      from: mockTokenAccount.token,
      to: mockCounterValueCurrency,
      value: mockTokenAccount.balance.toNumber(),
    });
    expect(fiatValue).toBe(50);
  });

  it("should handle empty account tuples", () => {
    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples: Array<{ account: Account; subAccount: TokenAccount | null }> = [];
    const accountNameMap = {};

    const detailedAccounts = result.current.createBaseDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts).toHaveLength(0);
  });

  it("should handle accounts with undefined fiat values", () => {
    mockCalculate.mockReturnValue(undefined); // Simulate undefined return

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const fiatValue = result.current.calculateFiatValue(mockAccount);
    expect(fiatValue).toBe(0); // Should default to 0
  });

  it("should preserve account properties in extended detailed accounts", () => {
    mockCalculate.mockReturnValue(1500);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: null }];
    const accountNameMap = { account1: "Custom Account Name" };

    const detailedAccounts = result.current.createExtendedDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts[0].account).toBe(mockAccount);
    expect(detailedAccounts[0].protocol).toBe("native_segwit");
    expect(detailedAccounts[0].parentAccount).toBeUndefined();
  });

  it("should use fallback name when parent account name is not in map for token accounts", () => {
    mockCalculate.mockReturnValue(1);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: mockTokenAccount }];
    const accountNameMap = {}; // Empty map - no parent account name

    const detailedAccounts = result.current.createBaseDetailedAccounts({
      asset: mockTokenAccount.token,
      accountTuples,
      accountNameMap,
      isTokenCurrency: true,
    });

    expect(detailedAccounts[0].name).toBe("USD Coin"); // Falls back to token name
  });

  it("should use fallback name when parent account name is not in map for extended token accounts", () => {
    mockCalculate.mockReturnValue(1);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: mockTokenAccount }];
    const accountNameMap = {}; // Empty map - no parent account name

    const detailedAccounts = result.current.createExtendedDetailedAccounts({
      asset: mockTokenAccount.token,
      accountTuples,
      accountNameMap,
      isTokenCurrency: true,
    });

    expect(detailedAccounts[0].name).toBe("USD Coin"); // Falls back to token name
    expect(detailedAccounts[0].account).toBe(mockTokenAccount);
    expect(detailedAccounts[0].parentAccount).toBe(mockAccount);
  });

  it("should handle null derivation mode in extended detailed accounts", () => {
    // Mock getTagDerivationMode to return null
    mockGetTagDerivationMode.mockReturnValue(null);

    mockCalculate.mockReturnValue(2500);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: null }];
    const accountNameMap = { account1: "My Account" };

    const detailedAccounts = result.current.createExtendedDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts[0].protocol).toBe(""); // Should fallback to empty string

    // Reset mock for other tests
    mockGetTagDerivationMode.mockReturnValue("native_segwit");
  });

  it("should use fallback name when account name is not in map for extended accounts", () => {
    mockCalculate.mockReturnValue(2500);

    const { result } = renderHook(() =>
      useDetailedAccountsCore(mockCounterValuesState, mockCounterValueCurrency),
    );

    const accountTuples = [{ account: mockAccount, subAccount: null }];
    const accountNameMap = {}; // Empty map - no account name

    const detailedAccounts = result.current.createExtendedDetailedAccounts({
      asset: mockAccount.currency,
      accountTuples,
      accountNameMap,
      isTokenCurrency: false,
    });

    expect(detailedAccounts[0].name).toBe("Ethereum"); // Falls back to currency name
    expect(detailedAccounts[0].account).toBe(mockAccount);
  });
});
