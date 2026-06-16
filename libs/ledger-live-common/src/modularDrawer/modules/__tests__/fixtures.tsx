import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { CryptoCurrency, FiatCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";
import { counterValuesApi } from "../../../counterValues/state-manager/api";

export const FIAT_CURRENCY_MAGNITUDE = 2;
export const ETH_FIAT_CONVERSION = 4589;
export const BTC_FIAT_CONVERSION = 45000;

export const ethereumCurrency = createFixtureCryptoCurrency("ethereum");
ethereumCurrency.id = "ethereum";
ethereumCurrency.name = "Ethereum";
ethereumCurrency.ticker = "ETH";
ethereumCurrency.units[0].magnitude = 18;

export const bitcoinCurrency = createFixtureCryptoCurrency("bitcoin");
bitcoinCurrency.id = "bitcoin";
bitcoinCurrency.name = "Bitcoin";
bitcoinCurrency.ticker = "BTC";
bitcoinCurrency.units[0].magnitude = 8;

export const mockFiatCurrency: FiatCurrency = {
  type: "FiatCurrency",
  ticker: "USD",
  name: "US Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "US Dollar",
      magnitude: FIAT_CURRENCY_MAGNITUDE,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
};

export const makeUsdcToken = (
  parentCurrency: CryptoCurrency,
  contractAddress: string,
  tokenType: string = "erc20",
  name: string = "USD Coin",
  explicitId?: string,
): TokenCurrency => {
  const id = explicitId ?? `${parentCurrency.id}/${tokenType}/usdc`;
  return {
    type: "TokenCurrency" as const,
    parentCurrencyId: parentCurrency.id,
    tokenType,
    id,
    contractAddress,
    ticker: "USDC",
    name,
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  };
};

const counterValuesCacheEntry = (conversion: number) => ({
  map: new Map([["latest", conversion]]),
  stats: {
    oldest: "2024-09-12",
    earliest: "2025-10-02T13",
    oldestDate: new Date(),
    earliestDate: new Date(),
    earliestStableDate: new Date(),
  },
});

export const createMockCounterValuesState = (
  entries: Record<string, number>,
): CounterValuesState => ({
  cache: Object.fromEntries(
    Object.entries(entries).map(([key, conversion]) => [key, counterValuesCacheEntry(conversion)]),
  ),
  data: {},
  status: {},
});

export const createBalanceDeps = (
  flattenedAccounts: ReturnType<typeof genAccount>[],
  cacheEntries: Record<string, number>,
) => ({
  counterValueCurrency: mockFiatCurrency,
  flattenedAccounts,
  state: createMockCounterValuesState(cacheEntries),
  locale: "en-US",
});

export const mockStore = configureStore({
  reducer: {
    assetsDataApi: (state = {}, _action: { type: string }) => state,
    [counterValuesApi.reducerPath]: counterValuesApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(counterValuesApi.middleware),
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
                  bitcoin: {
                    price: 45000,
                    priceChangePercentage24h: -2.5,
                    marketCap: 900000000000,
                    ticker: "BTC",
                    name: "Bitcoin",
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

export const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={mockStore}>{children}</Provider>
);
