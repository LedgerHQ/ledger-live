import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrenciesByProviderId } from "../../deposit/type";
import { haveOneCommonProvider } from "./haveOneCommonProvider";
import { getBalanceAndFiatValue } from "./getBalanceAndFiatValue";

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

const getEffectiveCurrency = (
  currency: CryptoOrTokenCurrency,
  provider: CurrenciesByProviderId,
  currencyIds: string[],
) => {
  const isCurrencyFiltered = currencyIds.includes(currency.id);

  if (isCurrencyFiltered) return currency;

  return provider.currenciesByNetwork.find(elem => currencyIds.includes(elem.id)) ?? currency;
};

export {
  isCorrespondingCurrency,
  getEffectiveCurrency,
  haveOneCommonProvider,
  getBalanceAndFiatValue,
};
