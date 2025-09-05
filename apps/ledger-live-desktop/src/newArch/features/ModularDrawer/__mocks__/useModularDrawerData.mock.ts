export const mockCurrencies = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC" },
  { id: "ethereum", name: "Ethereum", ticker: "ETH" },
  { id: "solana", name: "Solana", ticker: "SOL" },
];

export const expectedCurrenciesByProvider = [
  {
    providerId: "bitcoin",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "ethereum",
    nbCurrenciesByNetwork: 9,
  },
  {
    providerId: "ripple",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "ethereum/erc20/usd_tether__erc20_",
    nbCurrenciesByNetwork: 7,
  },
  {
    providerId: "bsc",
    nbCurrenciesByNetwork: 3,
  },
  {
    providerId: "solana",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "ethereum/erc20/usd__coin",
    nbCurrenciesByNetwork: 10,
  },
  {
    providerId: "ethereum/erc20/steth",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "tron",
    nbCurrenciesByNetwork: 1,
  },
  {
    providerId: "dogecoin",
    nbCurrenciesByNetwork: 1,
  },
];
