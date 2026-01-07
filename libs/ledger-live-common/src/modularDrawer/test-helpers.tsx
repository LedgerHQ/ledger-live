import React from "react";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { createFixtureCryptoCurrency } from "../mock/fixtures/cryptoCurrencies";
import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";
import { CryptoCurrency, FiatCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { Provider } from "react-redux";
import { configureStore, EnhancedStore } from "@reduxjs/toolkit";

export const ethereumCurrencyMagnitude = 18;
export const fiatCurrencyMagnitude = 2;
export const fiatConversion = 4589;
export const mockFiatCurrency: FiatCurrency = {
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

export const createEthereumCurrency = () => {
  const ethereumCurrency = createFixtureCryptoCurrency("ethereum");
  ethereumCurrency.id = "ethereum";
  ethereumCurrency.units[0].magnitude = ethereumCurrencyMagnitude;
  return ethereumCurrency;
};

export const createEthereumAccount = () => {
  const ethereumCurrency = createEthereumCurrency();
  const ethereumAccount = genAccount("ethereum-account", {
    currency: ethereumCurrency,
  });

  ethereumAccount.balance = new BigNumber("1000000000000000000000");
  ethereumAccount.spendableBalance = ethereumAccount.balance;

  return { ethereumAccount, ethereumCurrency };
};

export const createEthereumSetup = () => {
  const ethereumCurrency = createEthereumCurrency();
  const ethereumAccountHigh = genAccount("ethereum-account-high", {
    currency: ethereumCurrency,
  });

  ethereumAccountHigh.balance = new BigNumber("1000000000000000000000");
  ethereumAccountHigh.spendableBalance = ethereumAccountHigh.balance;

  return { ethereumCurrency, ethereumAccountHigh };
};

export const makeUsdcToken = (
  parentCurrency: CryptoCurrency,
  contractAddress: string,
  explicitId?: string,
  tokenType: string = "erc20",
  name: string = "USD Coin",
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

export const createEthereumWithToken = () => {
  const { ethereumCurrency, ethereumAccountHigh } = createEthereumSetup();

  const ethereumUsdcToken: TokenCurrency = makeUsdcToken(
    ethereumCurrency,
    "0xA0b86991c6218b3b0cE3606eB48",
    undefined,
    "erc20",
    "USD Coin",
  );
  const ethereumUsdcTokenAccount = genTokenAccount(0, ethereumAccountHigh, ethereumUsdcToken);
  ethereumUsdcTokenAccount.balance = new BigNumber("1000000000");
  ethereumAccountHigh.subAccounts = [ethereumUsdcTokenAccount];

  return { ethereumCurrency, ethereumAccountHigh, ethereumUsdcToken, ethereumUsdcTokenAccount };
};

export const createUseBalanceDeps = (ethereumAccount: ReturnType<typeof genAccount>) => () => {
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
    flattenedAccounts: [ethereumAccount],
    state: mockCounterValuesState,
    locale: "en-US",
  };
};

export const createMockStore = (): EnhancedStore => {
  return configureStore({
    reducer: {
      assetsDataApi: (state, _action) => state ?? {},
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
};

export const createWrapper = (
  store: EnhancedStore,
): React.ComponentType<{ children: React.ReactNode }> => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return Wrapper;
};
