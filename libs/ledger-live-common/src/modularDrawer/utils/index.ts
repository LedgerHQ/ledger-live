import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getBalanceAndFiatValue } from "./getBalanceAndFiatValue";
import { groupCurrenciesByProvider } from "./groupCurrenciesByProvider";

function isCorrespondingCurrency(
  elem: CryptoOrTokenCurrency,
  network: CryptoOrTokenCurrency,
): boolean {
  if (elem.type === "TokenCurrency") {
    return elem.parentCurrency?.id === network.id || elem.id === network.id;
  }
  if (elem.type === "CryptoCurrency") {
    return elem.id === network.id;
  }
  return false;
}

export { isCorrespondingCurrency, getBalanceAndFiatValue, groupCurrenciesByProvider };
