// For LLD Storybook

import { fn, Mock } from "@storybook/test";
import {
  arbitrumCurrency,
  arbitrumToken,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  injectiveCurrency,
  scrollCurrency,
  usdcToken,
} from "../../__mocks__/useSelectAssetFlow.mock";

export const res = {
  result: {
    currenciesByProvider: [
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
    ],
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

export const useGroupedCurrenciesByProvider: Mock = fn(() => ({
  ...res,
  loadingStatus: "success",
}));
