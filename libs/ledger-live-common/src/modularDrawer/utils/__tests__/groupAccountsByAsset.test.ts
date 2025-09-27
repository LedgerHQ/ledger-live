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

  const mockCounterValuesState: CounterValuesState = {} as CounterValuesState;
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
      },
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000), // 1 USDC in micro-USDC
        totalFiatValue: new BigNumber(1000000), // Mock returns balance as fiat value
        accounts: [mockUSDCAccount],
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
    });
  });
});
