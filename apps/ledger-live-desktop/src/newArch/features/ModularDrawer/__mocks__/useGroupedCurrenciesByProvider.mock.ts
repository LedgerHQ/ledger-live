import { fn, Mock } from "@storybook/test";
import {
  arbitrumCurrency,
  arbitrumToken,
  bitcoinCurrency,
  ethereumCurrency,
} from "./useSelectAssetFlow.mock";

export const res = {
  result: {
    currenciesByProvider: [
      {
        providerId: "bitcoin",
        currenciesByNetwork: [bitcoinCurrency],
      },
      {
        providerId: "ethereum",
        currenciesByNetwork: [ethereumCurrency, arbitrumCurrency],
      },
      { providerId: "arbitrum", currenciesByNetwork: [arbitrumToken] },
    ],
    sortedCryptoCurrencies: [bitcoinCurrency, ethereumCurrency, arbitrumToken],
  },
};

export const useGroupedCurrenciesByProvider: Mock = fn(() => ({
  ...res,
  loadingStatus: "success",
}));
