import { LoadingStatus } from "../../deposit/type";
import {
  arbitrumToken,
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockInjectiveCryptoCurrency,
  mockScrollCryptoCurrency,
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
      mockArbitrumCryptoCurrency,
      mockBaseCryptoCurrency,
      mockScrollCryptoCurrency,
    ],
  },
  { providerId: "arbitrum", currenciesByNetwork: [arbitrumToken] },
  { providerId: "usd-coin", currenciesByNetwork: [usdcToken] },
  { providerId: "injective-protocol", currenciesByNetwork: [mockInjectiveCryptoCurrency] },
];

export const res = {
  result: {
    currenciesByProvider: providers,
    sortedCryptoCurrencies: [
      mockBtcCryptoCurrency,
      mockEthCryptoCurrency,
      mockArbitrumCryptoCurrency,
      mockBaseCryptoCurrency,
      mockScrollCryptoCurrency,
      mockInjectiveCryptoCurrency,
    ],
  },
};

export const useGroupedCurrenciesByProvider: jest.Mock = jest.fn(() => ({
  ...res,
  loadingStatus: LoadingStatus.Success,
}));
