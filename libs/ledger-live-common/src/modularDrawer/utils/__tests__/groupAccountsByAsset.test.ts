import { groupAccountsByAsset } from "../groupAccountsByAsset";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";
import BigNumber from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

// Mock calculate function
jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  calculate: jest.fn((state, { value }) => {
    // Mock: return the balance directly as fiat value for simple testing
    return value;
  }),
}));

describe("groupAccountsByAsset", () => {
  const mockCurrency = createFixtureCryptoCurrency("bitcoin");
  const mockEthCurrency = createFixtureCryptoCurrency("ethereum");

  const mockCounterValuesState = {} as CounterValuesState;
  const mockTargetCurrency = createFixtureCryptoCurrency("usd");

  const mockUSDCToken = {
    type: "TokenCurrency" as const,
    id: "ethereum/erc20/usdc",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    parentCurrency: mockEthCurrency,
    tokenType: "erc20" as const,
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  };

  const mockBTCAccount: Account = {
    type: "Account",
    id: "btc-account-1",
    seedIdentifier: "seed-id",
    derivationMode: "",
    currency: mockCurrency,
    balance: new BigNumber(100000000), // 1 BTC
    spendableBalance: new BigNumber(100000000),
    blockHeight: 0,
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    index: 0,
    freshAddress: "btc-address",
    freshAddressPath: "44'/0'/0'/0/0",
    used: true,
    swapHistory: [],
    nfts: [],
    lastSyncDate: new Date(),
    creationDate: new Date(),
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: null },
      DAY: { balances: [], latestDate: null },
      WEEK: { balances: [], latestDate: null },
    },
  };

  const mockUSDCAccount: TokenAccount = {
    type: "TokenAccount",
    id: "usdc-account-1",
    token: mockUSDCToken,
    parentId: "eth-account-1",
    balance: new BigNumber(1000000), // 1 USDC
    spendableBalance: new BigNumber(1000000),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    swapHistory: [],
    creationDate: new Date(),
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: null },
      DAY: { balances: [], latestDate: null },
      WEEK: { balances: [], latestDate: null },
    },
  };

  it("should group accounts by asset ID and aggregate balances", () => {
    const accounts = [mockBTCAccount, mockUSDCAccount];
    const result = groupAccountsByAsset(accounts, mockCounterValuesState, mockTargetCurrency);

    expect(result).toEqual({
      [mockCurrency.id]: {
        totalBalance: new BigNumber(100000000), // 1 BTC in satoshis
        totalFiatValue: new BigNumber(100000000), // Mock returns balance as fiat value
        accounts: [mockBTCAccount],
        referenceCurrency: mockCurrency,
      },
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000), // 1 USDC in micro-USDC
        totalFiatValue: new BigNumber(1000000), // Mock returns balance as fiat value
        accounts: [mockUSDCAccount],
        referenceCurrency: mockUSDCToken,
      },
    });
  });

  it("should aggregate multiple accounts with the same asset", () => {
    const secondBTCAccount: Account = {
      ...mockBTCAccount,
      id: "btc-account-2",
      balance: new BigNumber(50000000), // 0.5 BTC
    };

    const accounts = [mockBTCAccount, secondBTCAccount];
    const result = groupAccountsByAsset(accounts, mockCounterValuesState, mockTargetCurrency);

    expect(result[mockCurrency.id]).toEqual({
      totalBalance: new BigNumber(150000000), // 1.5 BTC total
      totalFiatValue: new BigNumber(150000000), // Mock returns balance as fiat value
      accounts: [mockBTCAccount, secondBTCAccount],
      referenceCurrency: mockCurrency,
    });
  });

  it("should handle empty accounts array", () => {
    const result = groupAccountsByAsset([], mockCounterValuesState, mockTargetCurrency);
    expect(result).toEqual({});
  });

  it("should handle accounts with zero balance", () => {
    const zeroBalanceAccount: Account = {
      ...mockBTCAccount,
      balance: new BigNumber(0),
    };

    const accounts = [zeroBalanceAccount];
    const result = groupAccountsByAsset(accounts, mockCounterValuesState, mockTargetCurrency);

    expect(result[mockCurrency.id]).toEqual({
      totalBalance: new BigNumber(0),
      totalFiatValue: new BigNumber(0), // Mock returns balance (0) as fiat value
      accounts: [zeroBalanceAccount],
      referenceCurrency: mockCurrency,
    });
  });

  it("should set referenceCurrency to the first currency encountered for each asset group", () => {
    const accounts = [mockBTCAccount, mockUSDCAccount];
    const result = groupAccountsByAsset(accounts, mockCounterValuesState, mockTargetCurrency);

    expect(result[mockCurrency.id].referenceCurrency).toEqual(mockCurrency);
    expect(result[mockUSDCToken.id].referenceCurrency).toEqual(mockUSDCToken);
  });

  it("should normalize balances when tokens have different magnitudes", () => {
    // Create BSC USDC with different magnitude (18 decimals instead of 6)
    const mockBscUSDCToken = {
      ...mockUSDCToken,
      id: "bsc/bep20/usdc",
      name: "USD Coin (BSC)",
      ticker: "USDC",
      units: [{ name: "USD Coin", code: "USDC", magnitude: 18 }], // 18 decimals
    };

    const mockEthUSDCAccount: TokenAccount = {
      ...mockUSDCAccount,
      id: "eth-usdc-account",
      token: mockUSDCToken, // 6 decimals
      balance: new BigNumber(1000000), // 1 USDC with 6 decimals
    };

    const mockBscUSDCAccount: TokenAccount = {
      ...mockUSDCAccount,
      id: "bsc-usdc-account",
      token: mockBscUSDCToken, // 18 decimals
      balance: new BigNumber("1000000000000000000"), // 1 USDC with 18 decimals
    };

    // Both should be grouped under the same token ID for this test
    // First account (ETH USDC) becomes reference currency with 6 decimals
    const accounts = [mockEthUSDCAccount, mockBscUSDCAccount];
    const result = groupAccountsByAsset(accounts, mockCounterValuesState, mockTargetCurrency);

    const ethGroup = result[mockUSDCToken.id];
    expect(ethGroup.referenceCurrency).toEqual(mockUSDCToken); // First currency is reference
    expect(ethGroup.accounts).toHaveLength(1);
    expect(ethGroup.totalBalance).toEqual(new BigNumber(1000000)); // 1 USDC normalized to 6 decimals

    const bscGroup = result[mockBscUSDCToken.id];
    expect(bscGroup.referenceCurrency).toEqual(mockBscUSDCToken);
    expect(bscGroup.accounts).toHaveLength(1);
    expect(bscGroup.totalBalance).toEqual(new BigNumber("1000000000000000000")); // 1 USDC with 18 decimals
  });

  it("should normalize balances correctly when adding accounts with different magnitudes to same asset group", () => {
    // Create two USDC tokens with same ID but different magnitudes
    const ethUSDCToken = {
      ...mockUSDCToken,
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }], // 6 decimals
    };

    const bscUSDCToken = {
      ...mockUSDCToken,
      units: [{ name: "USD Coin", code: "USDC", magnitude: 18 }], // 18 decimals
    };

    const ethAccount: TokenAccount = {
      ...mockUSDCAccount,
      id: "eth-usdc",
      token: ethUSDCToken,
      balance: new BigNumber(1000000), // 1 USDC with 6 decimals
    };

    const bscAccount: TokenAccount = {
      ...mockUSDCAccount,
      id: "bsc-usdc",
      token: bscUSDCToken,
      balance: new BigNumber("1000000000000000000"), // 1 USDC with 18 decimals
    };

    // Process ETH account first to make it the reference currency
    const accounts = [ethAccount, bscAccount];
    const result = groupAccountsByAsset(accounts, mockCounterValuesState, mockTargetCurrency);

    const group = result[mockUSDCToken.id];
    expect(group.referenceCurrency).toEqual(ethUSDCToken); // First currency is reference (6 decimals)
    expect(group.accounts).toHaveLength(2);

    // BSC balance should be normalized from 18 decimals to 6 decimals
    // 1000000000000000000 (18 decimals) -> 1000000 (6 decimals)
    // magnitudeDiff = 6 - 18 = -12
    // normalized = 1000000000000000000 * 10^(-12) = 1000000
    const expectedTotal = new BigNumber(1000000).plus(new BigNumber(1000000)); // 2 USDC total
    expect(group.totalBalance).toEqual(expectedTotal);
  });
});
