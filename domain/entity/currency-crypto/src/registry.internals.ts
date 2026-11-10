/**
 * Legacy alias keys whose source-literal key differs from the currency `.id` (some ids are exposed
 * under an alternate historical key). The accessors resolve these so `getCryptoCurrencyById` keeps
 * working for the alias keys. Maps the alias key to its canonical id.
 */
export const CRYPTO_CURRENCY_ALIASES: Record<string, string> = {
  osmosis: "osmo",
  groestlcoin: "groestcoin",
  lbry: "LBRY",
};
