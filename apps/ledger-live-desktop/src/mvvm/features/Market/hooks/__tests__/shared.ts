export const MARKET_API = "https://global.api.prd.ledger.com/countervalue/v3/markets";
export const DADA_API = "https://dada.api.ledger.com/v1/assets";

export const EMPTY_DADA_RESPONSE = {
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
};
