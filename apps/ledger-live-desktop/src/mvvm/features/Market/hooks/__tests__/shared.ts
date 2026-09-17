export const MARKET_API = "https://countervalues.live.ledger.com/v3/markets";
export const DADA_API =
  "https://gravitee-internal-gateway.ldg-stg-apim.aws.stg.ldg-tech.com/dada/assets";

export const EMPTY_DADA_RESPONSE = {
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
};
