import { fn, Mock } from "@storybook/test";
import { arbitrumCurrency, bitcoinCurrency, ethereumCurrency } from "./useSelectAssetFlow.mock";

const res = {
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
      { providerId: "arbitrum", currenciesByNetwork: [arbitrumCurrency] },
    ],
    sortedCryptoCurrencies: [bitcoinCurrency, ethereumCurrency, arbitrumCurrency],
  },
};

export const useGroupedCurrenciesByProvider: Mock = fn(() => res);
