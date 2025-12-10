/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { mockEthCryptoCurrency } from "../../__mocks__/currencies.mock";
import { groupCurrenciesByAsset } from "../../utils";
import createAssetConfigurationHook from "../createAssetConfiguration";
import { BigNumber } from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";
import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";
import { CryptoCurrency, FiatCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

export const makeUsdcToken = (
  parentCurrency: CryptoCurrency,
  contractAddress: string,
  tokenType: string = "erc20",
  name: string = "USD Coin",
  explicitId?: string,
) => {
  const id = explicitId ?? `${parentCurrency.id}/${tokenType}/usdc`;
  return {
    type: "TokenCurrency" as const,
    parentCurrency,
    tokenType,
    id,
    contractAddress,
    ticker: "USDC",
    name,
    units: [
      {
        name: "USD Coin",
        code: "USDC",
        magnitude: 6,
      },
    ],
  };
};

const ApyIndicator = () => null;
const MarketPercentIndicator = () => null;
const MarketPriceIndicator = jest.fn(() => null);

const ethereumCurrencyMagnitude = 18;
const fiatCurrencyMagnitude = 2;
const fiatConversion = 4589;

const ethereumCurrency = createFixtureCryptoCurrency("ethereum");
ethereumCurrency.id = "ethereum";
ethereumCurrency.units[0].magnitude = ethereumCurrencyMagnitude;
const ethereumAccountHigh = genAccount("ethereum-account-high", {
  currency: ethereumCurrency,
});

ethereumAccountHigh.balance = new BigNumber("1000000000000000000000");
ethereumAccountHigh.spendableBalance = ethereumAccountHigh.balance;

const ethereumUsdcToken: TokenCurrency = makeUsdcToken(ethereumCurrency, "erc20", "USD Coin");
const ethereumUsdcTokenAccount = genTokenAccount(0, ethereumAccountHigh, ethereumUsdcToken);
ethereumUsdcTokenAccount.balance = new BigNumber("1000000000");
ethereumAccountHigh.subAccounts = [ethereumUsdcTokenAccount];

const mockFiatCurrency: FiatCurrency = {
  type: "FiatCurrency",
  ticker: "USD",
  name: "US Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "US Dollar",
      magnitude: fiatCurrencyMagnitude,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
};

const useBalanceDeps = () => {
  const mockCounterValuesState: CounterValuesState = {
    cache: {
      "USD ethereum": {
        map: new Map([["latest", fiatConversion]]),
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
    flattenedAccounts: [ethereumAccountHigh],
    state: mockCounterValuesState,
    locale: "en-US",
  };
};

const balanceItem = jest.fn(() => null);

const assetConfigurationDeps = {
  useBalanceDeps,
  balanceItem,
  ApyIndicator,
  MarketPercentIndicator,
  MarketPriceIndicator,
  assetsMap: groupCurrenciesByAsset([
    {
      asset: {
        id: "ethereum",
        ticker: "ETH",
        name: "Ethereum",
        assetsIds: {
          ethereum: "ethereum",
          arbitrum: "arbitrum",
        },
        metaCurrencyId: "ethereum",
      },
      networks: [mockEthCryptoCurrency],
    },
  ]),
};

describe("createAssetConfiguration", () => {
  it("should call balanceItem with correct BalanceUI objects for each asset", () => {
    renderHook(() =>
      createAssetConfigurationHook(assetConfigurationDeps)({
        assetsConfiguration: { rightElement: "balance" },
      })([ethereumCurrency]),
    );

    expect(balanceItem).toHaveBeenCalledTimes(1);
    expect(balanceItem).toHaveBeenNthCalledWith(1, {
      currency: ethereumCurrency,
      balance: ethereumAccountHigh.balance,
      fiatValue: ethereumAccountHigh.balance
        .shiftedBy(fiatCurrencyMagnitude - ethereumCurrencyMagnitude)
        .multipliedBy(fiatConversion)
        .toNumber(),
    });
  });

  const store = configureStore({
    reducer: {
      assetsDataApi: (state = {}, _action) => state,
    },
    preloadedState: {
      assetsDataApi: {
        queries: {
          mockMarketsQuery: {
            data: {
              pages: [
                {
                  markets: {
                    ethereum: {
                      price: 2500.5,
                      priceChangePercentage24h: 5.25,
                      marketCap: 300000000000,
                      ticker: "ETH",
                      name: "Ethereum",
                    },
                  },
                  interestRates: {
                    ethereum: {
                      currencyId: "ethereum",
                      rate: 0.045,
                      type: "APY",
                      fetchAt: "2024-10-13T10:00:00Z",
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  });

  it("should generate market trend right element with correct market trend data", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { rightElement: "marketTrend" },
        })([ethereumCurrency]),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );

    const rightElement = current[0]?.rightElement;
    expect(rightElement).toBeDefined();
    expect(React.isValidElement(rightElement)).toBe(true);
    if (React.isValidElement(rightElement)) {
      expect(rightElement.props).toEqual({
        percent: 5.25,
        price: "$2,500.50",
      });
    }
  });

  it("should generate apy left element when leftElement is 'apy'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { leftElement: "apy" },
        })([ethereumCurrency]),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );

    expect((current[0]?.leftElement as React.ReactElement).props).toEqual({
      value: 4.5,
      type: "APY",
    });
  });

  it("should generate market trend left element when leftElement is 'marketTrend'", () => {
    const {
      result: { current },
    } = renderHook(
      () =>
        createAssetConfigurationHook(assetConfigurationDeps)({
          assetsConfiguration: { leftElement: "marketTrend" },
        })([ethereumCurrency]),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );

    expect((current[0]?.leftElement as React.ReactElement).props).toEqual({
      percent: 5.25,
    });
  });

  it("should return an empty array when assets is an empty array", () => {
    const {
      result: { current },
    } = renderHook(() =>
      createAssetConfigurationHook(assetConfigurationDeps)({
        assetsConfiguration: { rightElement: "balance" },
      })([]),
    );

    expect(current).toEqual([]);
  });
});
