import { fn } from "@storybook/test";

export default () => {};

export const ipcRenderer = () => {};

const currency = {
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

export const useGroupedCurrenciesByProvider = fn(() => ({
  result: {
    currenciesByProvider: [
      {
        providerId: "bitcoin",
        currenciesByNetwork: [currency],
      },
    ],
    sortedCryptoCurrencies: [currency],
  },
  loadingStatus: "success",
}));

export const findCryptoCurrencyById = (id: string) => [currency];
