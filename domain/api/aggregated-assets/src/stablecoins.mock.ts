const STABLECOIN_TICKERS = [
  "USDT",
  "USDC",
  "USDS",
  "USDE",
  "DAI",
  "USD1",
  "PYUSD",
  "PAXG",
  "USDG",
  "RLUSD",
  "USDD",
  "TUSD",
  "EURC",
  "FDUSD",
  "CRVUSD",
  "FRAX",
  "AUSD",
  "BUSD",
  "EURI",
  "GUSD",
];

export const mockStablecoinsResponse = {
  cryptoAssets: Object.fromEntries(
    STABLECOIN_TICKERS.map(ticker => [
      `urn:crypto:meta-currency:${ticker.toLowerCase()}`,
      {
        id: `urn:crypto:meta-currency:${ticker.toLowerCase()}`,
        ticker,
        name: ticker,
        assetsIds: {},
      },
    ]),
  ),
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: {
    key: "marketCap",
    order: "desc",
    metaCurrencyIds: STABLECOIN_TICKERS.map(t => `urn:crypto:meta-currency:${t.toLowerCase()}`),
  },
};
