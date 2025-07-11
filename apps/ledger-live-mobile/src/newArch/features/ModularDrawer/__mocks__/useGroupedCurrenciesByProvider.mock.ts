import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import {
  arbitrumCurrency,
  arbitrumToken,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  injectiveCurrency,
  scrollCurrency,
  usdcToken,
} from "./currencies.mock";

export const providers = [
  {
    providerId: "bitcoin",
    currenciesByNetwork: [bitcoinCurrency],
  },
  {
    providerId: "ethereum",
    currenciesByNetwork: [ethereumCurrency, arbitrumCurrency, baseCurrency, scrollCurrency],
  },
  { providerId: "arbitrum", currenciesByNetwork: [arbitrumToken] },
  { providerId: "usd-coin", currenciesByNetwork: [usdcToken] },
  { providerId: "injective-protocol", currenciesByNetwork: [injectiveCurrency] },
];

export const res = {
  result: {
    currenciesByProvider: providers,
    sortedCryptoCurrencies: [
      bitcoinCurrency,
      ethereumCurrency,
      arbitrumToken,
      baseCurrency,
      scrollCurrency,
      injectiveCurrency,
    ],
  },
};

export const useGroupedCurrenciesByProvider: jest.Mock = jest.fn(() => ({
  ...res,
  loadingStatus: LoadingStatus.Success,
}));
