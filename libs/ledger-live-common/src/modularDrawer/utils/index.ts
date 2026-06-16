import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
export { groupCurrenciesByAsset } from "./groupCurrenciesByAsset";
export { sortAccountsByFiatValue } from "./sortAccountsByFiatValue";

const getBaseId = (currency: CryptoOrTokenCurrency) =>
  currency.type === "CryptoCurrency" ? currency.id : currency.parentCurrencyId;

function belongsToSameNetwork(
  elem: CryptoOrTokenCurrency,
  network: CryptoOrTokenCurrency,
): boolean {
  return getBaseId(elem) === getBaseId(network);
}
export { getBaseId, belongsToSameNetwork };
