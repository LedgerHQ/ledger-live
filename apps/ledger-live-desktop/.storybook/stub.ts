import { fn } from "@storybook/test";

export default () => {};

export const ipcRenderer = () => {};

const bitcoinCurrency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  color: "#ffae35",
  units: [
    {
      name: "bitcoin",
      code: "BTC",
      magnitude: 8,
    },
  ],
  family: "bitcoin",
  explorerId: "btc",
};

const ethereumCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  coinType: 60,
  name: "Ethereum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "ethereum",
  color: "#0ebdcd",
  family: "evm",
  units: [
    {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
  ],
  explorerId: "eth",
};

const arbitrumCurrency = {
  type: "CryptoCurrency",
  id: "arbitrum",
  coinType: 60,
  name: "Arbitrum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "arbitrum",
  color: "#28a0f0",
  family: "evm",
  units: [
    {
      name: "ETH",
      code: "ETH",
      magnitude: 18,
    },
  ],
};

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
    ],
    sortedCryptoCurrencies: [bitcoinCurrency, ethereumCurrency, arbitrumCurrency],
  },
  loadingStatus: "success",
};

export const useGroupedCurrenciesByProvider = fn(() => res);

export const findCryptoCurrencyById = (id: string) =>
  [bitcoinCurrency, ethereumCurrency, arbitrumCurrency].find(a => a.id === id);
