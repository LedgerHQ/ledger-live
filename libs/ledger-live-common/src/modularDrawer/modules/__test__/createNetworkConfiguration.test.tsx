/**
 * @jest-environment jsdom
 */

import React from "react";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";
import { createNetworkConfigurationHook } from "../createNetworkConfiguration";
import { renderHook } from "@testing-library/react";
import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";
import { FiatCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

const bscCurrency = createFixtureCryptoCurrency("bsc");
const bscAccount = genAccount("bsc-account", { currency: bscCurrency });
const bscUsdcToken: TokenCurrency = {
  type: "TokenCurrency",
  parentCurrency: bscCurrency,
  tokenType: "bep20",
  id: "bsc/erc20/usdc",
  contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  ticker: "USDC",
  name: "USD Coin",
  units: [
    {
      name: "Binance-Peg USD Coin",
      code: "USDC",
      magnitude: 18,
    },
  ],
};
const bscUsdcTokenAccount = genTokenAccount(0, bscAccount, bscUsdcToken);
bscAccount.subAccounts = [bscUsdcTokenAccount];

// Create Base account with USDC token
const baseCurrency = createFixtureCryptoCurrency("base");
const baseAccount = genAccount("base-account", { currency: baseCurrency });
const baseUsdcToken: TokenCurrency = {
  type: "TokenCurrency",
  parentCurrency: baseCurrency,
  tokenType: "erc20",
  id: "base/erc20/usd_coin",
  contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  ticker: "USDC",
  name: "USD Coin",
  units: [
    {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
    },
  ],
};
const baseUsdcTokenAccount = genTokenAccount(0, baseAccount, baseUsdcToken);
baseAccount.subAccounts = [baseUsdcTokenAccount];

const useAccountData = () => {
  return [
    {
      asset: createFixtureCryptoCurrency("bsc"),
      label: "2 accounts",
      count: 2,
    },
    {
      asset: createFixtureCryptoCurrency("ethereum"),
      label: "0 accounts",
      count: 0,
    },
    {
      asset: createFixtureCryptoCurrency("avalanche_c_chain"),
      label: "0 accounts",
      count: 0,
    },
  ];
};

const accountsCount = jest.fn(() => <h1>test</h1>);
const accountsCountAndApy = () => <h1>test</h1>;
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

  return {
    counterValueCurrency: mockFiatCurrency,
    flattenedAccounts: [bscAccount, bscUsdcTokenAccount, baseAccount, baseUsdcTokenAccount],
    state: mockCounterValuesState,
    locale: "en-US",
  };
};
const balanceItem = jest.fn(() => <h1>test</h1>);

describe("createNetworkConfiguration", () => {
  it("should call balanceItem with correct BalanceUI objects for each network", () => {
    const networkConfigurationDeps = {
      useAccountData,
      accountsCount,
      accountsCountAndApy,
      useBalanceDeps,
      balanceItem,
    };

    const { result } = renderHook(() => createNetworkConfigurationHook(networkConfigurationDeps));
    const res = result.current({ networksConfig: { rightElement: "balance" } });
    res([baseCurrency, bscCurrency], [baseUsdcToken, bscUsdcToken]);

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
    const networkConfigurationDeps = {
      useAccountData,
      accountsCount,
      accountsCountAndApy,
      useBalanceDeps,
      balanceItem,
    };

    const { result } = renderHook(() => createNetworkConfigurationHook(networkConfigurationDeps));
    const res = result.current({ networksConfig: { leftElement: "numberOfAccounts" } });
    res([baseCurrency, bscCurrency], [baseUsdcToken, bscUsdcToken]);

    expect(accountsCount).toHaveBeenCalledTimes(1);
    expect(accountsCount).toHaveBeenNthCalledWith(1, { label: "2 accounts" });
  });
});
