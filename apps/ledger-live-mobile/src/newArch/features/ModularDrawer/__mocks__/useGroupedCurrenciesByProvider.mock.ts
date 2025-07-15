import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import {
  arbitrumToken,
  injectiveCurrency,
  mockArbitrumCurrency,
  mockBaseCurrency,
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockScrollCurrency,
  usdcToken,
} from "./currencies.mock";

export const providers = [
  {
    providerId: "bitcoin",
    currenciesByNetwork: [mockBtcCryptoCurrency],
  },
  {
    providerId: "ethereum",
    currenciesByNetwork: [
      mockEthCryptoCurrency,
      mockArbitrumCurrency,
      mockBaseCurrency,
      mockScrollCurrency,
    ],
  },
  { providerId: "arbitrum", currenciesByNetwork: [arbitrumToken] },
  { providerId: "usd-coin", currenciesByNetwork: [usdcToken] },
  { providerId: "injective-protocol", currenciesByNetwork: [injectiveCurrency] },
];

export const res = {
  result: {
    currenciesByProvider: providers,
    sortedCryptoCurrencies: [
      mockBtcCryptoCurrency,
      mockEthCryptoCurrency,
      arbitrumToken,
      mockBaseCurrency,
      mockScrollCurrency,
      injectiveCurrency,
    ],
  },
};

export const useGroupedCurrenciesByProvider: jest.Mock = jest.fn(() => ({
  ...res,
  loadingStatus: LoadingStatus.Success,
}));
