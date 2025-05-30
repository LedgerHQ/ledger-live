import { fn, Mock } from "@storybook/test";
import {
  arbitrumCurrency,
  arbitrumToken,
  bitcoinCurrency,
  ethereumCurrency,
} from "./useSelectAssetFlow.mock";

const res = {
  result: {
    currenciesByProvider: [
      {
        providerId: "bitcoin",
        currenciesByNetwork: [bitcoinCurrency],
      },
      {
        providerId: "ethereum",
        currenciesByNetwork: [ethereumCurrency, arbitrumCurrency, arbitrumParentCurrency],
      },
      { providerId: "arbitrum", currenciesByNetwork: [arbitrumCurrency] },
    ],
    sortedCryptoCurrencies: [bitcoinCurrency, ethereumCurrency, arbitrumToken],
  },
};

export const useGroupedCurrenciesByProvider: Mock = fn(() => res);
