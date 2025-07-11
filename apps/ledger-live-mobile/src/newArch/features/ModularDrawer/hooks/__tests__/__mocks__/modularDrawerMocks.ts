import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const mockEthCryptoCurrency: CryptoCurrency = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  type: "CryptoCurrency",
  managerAppName: "ethereum",
  coinType: 60,
  scheme: "ethereum",
  color: "#627eea",
  family: "evm",
  blockAvgTime: 15,
  explorerViews: [],
  units: [
    {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
  ],
};

export const mockBtcCryptoCurrency: CryptoCurrency = {
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  type: "CryptoCurrency",
  managerAppName: "bitcoin",
  coinType: 0,
  scheme: "bitcoin",
  color: "#f7931a",
  family: "bitcoin",
  blockAvgTime: 600,
  explorerViews: [],
  units: [
    {
      name: "bitcoin",
      code: "BTC",
      magnitude: 8,
    },
  ],
};

export const mockCurrenciesByProvider = [
  {
    providerId: "ethereum",
    currenciesByNetwork: [mockEthCryptoCurrency],
  },
];

export const mockCurrencyIds = ["bitcoin", "ethereum", "arbitrum", "base"];
