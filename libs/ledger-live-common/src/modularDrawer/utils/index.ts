import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
export { groupCurrenciesByAsset } from "./groupCurrenciesByAsset";
export { sortAccountsByFiatValue } from "./sortAccountsByFiatValue";
export { getApyAppearance } from "./getApyAppearance";

const getBaseId = (currency: CryptoOrTokenCurrency) =>
  currency.type === "CryptoCurrency" ? currency.id : currency.parentCurrency.id;

function belongsToSameNetwork(
  elem: CryptoOrTokenCurrency,
  network: CryptoOrTokenCurrency,
): boolean {
  return getBaseId(elem) === getBaseId(network);
}
export { getBaseId, belongsToSameNetwork };
