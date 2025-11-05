import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
export { groupCurrenciesByProvider } from "./groupCurrenciesByProvider";
export { sortAccountsByFiatValue } from "./sortAccountsByFiatValue";

const getBaseId = (currency: CryptoOrTokenCurrency) =>
  currency.type === "CryptoCurrency" ? currency.id : currency.parentCurrency.id;

function belongsToSameNetwork(
  elem: CryptoOrTokenCurrency,
  network: CryptoOrTokenCurrency,
): boolean {
  return getBaseId(elem) === getBaseId(network);
}
export { getBaseId, belongsToSameNetwork };
