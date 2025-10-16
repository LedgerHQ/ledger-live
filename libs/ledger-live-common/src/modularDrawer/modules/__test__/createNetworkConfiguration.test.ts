/**
 * @jest-environment jsdom
 */

import { BigNumber } from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";
import { createNetworkConfigurationHook } from "../createNetworkConfiguration";
import { renderHook } from "@testing-library/react";
import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";
import { FiatCurrency, TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { makeUsdcToken } from "./createAssetConfiguration.test";

const bscCurrency = createFixtureCryptoCurrency("bsc");
const bscAccount = genAccount("bsc-account", { currency: bscCurrency });
const bscUsdcToken: TokenCurrency = makeUsdcToken(
  bscCurrency,
  "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  "bep20",
  "USD Coin",
  "bsc/erc20/usdc",
);
const bscUsdcTokenAccount = genTokenAccount(0, bscAccount, bscUsdcToken);
bscAccount.subAccounts = [bscUsdcTokenAccount];

const baseCurrency = createFixtureCryptoCurrency("base");
const baseAccount = genAccount("base-account", { currency: baseCurrency });
const baseUsdcToken: TokenCurrency = makeUsdcToken(
  baseCurrency,
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "erc20",
  "USD Coin",
  "base/erc20/usd_coin",
);
const baseUsdcTokenAccount = genTokenAccount(0, baseAccount, baseUsdcToken);
baseAccount.subAccounts = [baseUsdcTokenAccount];

const ethereumCurrency = createFixtureCryptoCurrency("ethereum");
const ethereumAccountHigh = genAccount("ethereum-account-high", {
  currency: ethereumCurrency,
});

ethereumAccountHigh.balance = new BigNumber("1000000000000000000000");
ethereumAccountHigh.spendableBalance = ethereumAccountHigh.balance;

const ethereumUsdcToken: TokenCurrency = makeUsdcToken(
  ethereumCurrency,
  "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "erc20",

  "USD Coin",
);
const ethereumUsdcTokenAccount = genTokenAccount(0, ethereumAccountHigh, ethereumUsdcToken);
ethereumAccountHigh.subAccounts = [ethereumUsdcTokenAccount];

const ethereumAccountLow = genAccount("ethereum-account-low", {
  currency: ethereumCurrency,
});
ethereumAccountLow.balance = new BigNumber("100000000000000000");
ethereumAccountLow.spendableBalance = ethereumAccountLow.balance;

const ethereumAccountZero = genAccount("ethereum-account-zero", {
  currency: ethereumCurrency,
});
ethereumAccountZero.balance = new BigNumber("0");
ethereumAccountZero.spendableBalance = ethereumAccountZero.balance;

const polygonCurrency = createFixtureCryptoCurrency("polygon");
const polygonAccountMedium = genAccount("polygon-account-medium", {
  currency: polygonCurrency,
});
polygonAccountMedium.balance = new BigNumber("500000000000000000000");
polygonAccountMedium.spendableBalance = polygonAccountMedium.balance;

const polygonUsdcToken: TokenCurrency = makeUsdcToken(
  polygonCurrency,
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "erc20",
  "USD Coin",
);
const polygonUsdcTokenAccount = genTokenAccount(0, polygonAccountMedium, polygonUsdcToken);
polygonAccountMedium.subAccounts = [polygonUsdcTokenAccount];

const makeAccountData = (asset, count) => ({
  asset,
  label: `${count} account`,
  count,
});

const useAccountData = () => {
  return [
    makeAccountData(createFixtureCryptoCurrency("ethereum"), 3),
    makeAccountData(createFixtureCryptoCurrency("polygon"), 1),
    makeAccountData(createFixtureCryptoCurrency("bsc"), 2),
    makeAccountData(createFixtureCryptoCurrency("base"), 1),
    makeAccountData(createFixtureCryptoCurrency("avalanche_c_chain"), 0),
  ];
};

const mockFiatCurrency: FiatCurrency = {
  type: "FiatCurrency",
  ticker: "USD",
  name: "US Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "US Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
};

const accountsCount = jest.fn(() => null);
const accountsCountAndApy = () => null;
const useBalanceDeps = () => {
  const mockCounterValuesState: CounterValuesState = {
    cache: {
      "USD testCoinId": {
        fallback: 2354.213,
        map: new Map(),
        stats: {
          oldest: "2024-09-12",
          earliest: "2025-10-02T13",
          oldestDate: new Date(),
          earliestDate: new Date(),
          earliestStableDate: new Date(),
        },
      },
    },
    data: {},
    status: {},
  };

  return {
    counterValueCurrency: mockFiatCurrency,
    flattenedAccounts: [
      bscAccount,
      bscUsdcTokenAccount,
      baseAccount,
      baseUsdcTokenAccount,
      ethereumAccountHigh,
      ethereumUsdcTokenAccount,
      ethereumAccountLow,
      ethereumAccountZero,
      polygonAccountMedium,
      polygonUsdcTokenAccount,
    ],
    state: mockCounterValuesState,
    locale: "en-US",
  };
};
const balanceItem = jest.fn(() => null);

const networkConfigurationDeps = {
  useAccountData,
  accountsCount,
  accountsCountAndApy,
  useBalanceDeps,
  balanceItem,
};

describe("createNetworkConfiguration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call balanceItem with correct BalanceUI objects for each network", () => {
    const { result } = renderHook(() => createNetworkConfigurationHook(networkConfigurationDeps));
    const res = result.current({ networksConfig: { rightElement: "balance" } });
    res([baseUsdcToken, bscUsdcToken]);

    expect(balanceItem).toHaveBeenCalledTimes(2);
    expect(balanceItem).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ balance: baseUsdcTokenAccount.balance }),
    );
    expect(balanceItem).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ balance: bscUsdcTokenAccount.balance }),
    );
  });

  it("account count", () => {
    const { result } = renderHook(() => createNetworkConfigurationHook(networkConfigurationDeps));
    const res = result.current({ networksConfig: { leftElement: "numberOfAccounts" } });
    res([baseUsdcToken, bscUsdcToken]);

    expect(accountsCount).toHaveBeenCalledTimes(4);
    expect(accountsCount).toHaveBeenNthCalledWith(1, { label: "3 account" });
  });

  it("should order by balance (highest first) when only balance element is present", () => {
    const { result } = renderHook(() => createNetworkConfigurationHook(networkConfigurationDeps));
    const res = result.current({
      networksConfig: { rightElement: "balance" },
    });

    const orderedResult = res([ethereumUsdcToken, polygonUsdcToken, bscUsdcToken]);

    expect(orderedResult).toHaveLength(3);

    // Should be ordered by balance amount (highest first)
    expect(orderedResult[0].id).toBe(ethereumCurrency.id); // 1000 ETH
    expect(orderedResult[1].id).toBe(polygonCurrency.id); // 500 MATIC
    expect(orderedResult[2].id).toBe(bscCurrency.id); // Lower balance
  });

  it("should order by account count (highest first) when only account count element is present", () => {
    const { result } = renderHook(() => createNetworkConfigurationHook(networkConfigurationDeps));
    const res = result.current({
      networksConfig: { leftElement: "numberOfAccounts" },
    });

    const orderedResult = res([ethereumUsdcToken, polygonUsdcToken, bscUsdcToken]);

    expect(orderedResult).toHaveLength(3);

    // Should be ordered by account count (highest first)
    expect(orderedResult[0].id).toBe(ethereumCurrency.id); // 3 accounts
    expect(orderedResult[1].id).toBe(bscCurrency.id); // 2 accounts
    expect(orderedResult[2].id).toBe(polygonCurrency.id); // 1 account
  });

  it("should handle networks with zero balances by ordering them by account count", () => {
    const zeroBalanceEth = { ...ethereumAccountZero };
    const zeroBalancePoly = {
      ...polygonAccountMedium,
      balance: new BigNumber("0"),
      spendableBalance: new BigNumber("0"),
    };

    const mockUseBalanceDepsZero = () => ({
      counterValueCurrency: {
        type: "FiatCurrency" as const,
        ticker: "USD",
        name: "US Dollar",
        symbol: "$",
        units: [
          { code: "$", name: "US Dollar", magnitude: 2, showAllDigits: true, prefixCode: true },
        ],
      },
      flattenedAccounts: [zeroBalanceEth, zeroBalancePoly],
      state: { cache: {}, data: {}, status: {} },
      locale: "en-US",
    });

    const { result } = renderHook(() =>
      createNetworkConfigurationHook({
        ...networkConfigurationDeps,
        useBalanceDeps: mockUseBalanceDepsZero,
      }),
    );
    const res = result.current({
      networksConfig: { leftElement: "numberOfAccounts", rightElement: "balance" },
    });

    const orderedResult = res([ethereumUsdcToken, polygonUsdcToken]);

    expect(orderedResult).toHaveLength(2);

    // When both have zero balance, should order by account count
    expect(orderedResult[0].id).toBe(ethereumCurrency.id); // 3 accounts
    expect(orderedResult[1].id).toBe(polygonCurrency.id); // 1 account
  });

  it("should prioritise non-zero balances over account count", () => {
    const testEthereumCurrency: CryptoCurrency = createFixtureCryptoCurrency("ethereum");
    const testPolygonCurrency: CryptoCurrency = createFixtureCryptoCurrency("polygon");
    const testAvalancheCurrency: CryptoCurrency = createFixtureCryptoCurrency("avalanche_c_chain");
    const testArbitrumCurrency: CryptoCurrency = createFixtureCryptoCurrency("arbitrum");

    const testEthereumAccount = genAccount("test-ethereum-account", {
      currency: testEthereumCurrency,
    });
    testEthereumAccount.balance = new BigNumber("1000000000000000000000");
    testEthereumAccount.spendableBalance = testEthereumAccount.balance;

    const testPolygonAccount = genAccount("test-polygon-account", {
      currency: testPolygonCurrency,
    });
    testPolygonAccount.balance = new BigNumber("500000000000000000000");
    testPolygonAccount.spendableBalance = testPolygonAccount.balance;

    const testEthereumUsdcToken = makeUsdcToken(
      testEthereumCurrency,
      "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    );
    const testPolygonUsdcToken = makeUsdcToken(
      testPolygonCurrency,
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    );
    const testAvalancheUsdcToken = makeUsdcToken(
      testAvalancheCurrency,
      "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    );
    const testArbitrumUsdcToken = makeUsdcToken(
      testArbitrumCurrency,
      "0xFF970A61A04b1cA14834A43f5de4533eBDDB5CC8",
    );

    const testUseBalanceDeps = () => ({
      counterValueCurrency: mockFiatCurrency,
      flattenedAccounts: [testEthereumAccount, testPolygonAccount],
      state: { cache: {}, data: {}, status: {} },
      locale: "en-US",
    });

    const testUseAccountData = () => [
      makeAccountData(testEthereumCurrency, 3),
      makeAccountData(testPolygonCurrency, 1),
      makeAccountData(testAvalancheCurrency, 1),
      makeAccountData(testArbitrumCurrency, 2),
    ];

    const { result } = renderHook(() =>
      createNetworkConfigurationHook({
        ...networkConfigurationDeps,
        useAccountData: testUseAccountData,
        useBalanceDeps: testUseBalanceDeps,
      }),
    );

    const res = result.current({
      networksConfig: { leftElement: "numberOfAccounts", rightElement: "balance" },
    });

    const orderedResult = res([
      testEthereumUsdcToken,
      testPolygonUsdcToken,
      testAvalancheUsdcToken,
      testArbitrumUsdcToken,
    ]);

    expect(orderedResult[0].id).toBe(testEthereumCurrency.id); // 1000 ETH balance, 3 accounts
    expect(orderedResult[1].id).toBe(testPolygonCurrency.id); // 500 MATIC balance, 1 account
    expect(orderedResult[2].id).toBe(testArbitrumCurrency.id); // (0 balance, 2 accounts)
    expect(orderedResult[3].id).toBe(testAvalancheCurrency.id); // (0 balance, 1 account)
  });
});
