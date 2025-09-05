import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getTokenOrCryptoCurrencyById } from "../../deposit/helper";

export const getProviderCurrency = (
  mainCurrency: CryptoOrTokenCurrency,
  currencies: CryptoOrTokenCurrency[],
) => {
  try {
    return getTokenOrCryptoCurrencyById(mainCurrency.id);
  } catch {
    return getTokenOrCryptoCurrencyById(currencies[0].id);
  }
};
