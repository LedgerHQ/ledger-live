import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getTokenOrCryptoCurrencyById } from "../../deposit/helper";

export const getProviderCurrency = async (
  mainCurrency: CryptoOrTokenCurrency,
  currencies: CryptoOrTokenCurrency[],
): Promise<CryptoOrTokenCurrency> => {
  try {
    return await getTokenOrCryptoCurrencyById(mainCurrency.id);
  } catch {
    return await getTokenOrCryptoCurrencyById(currencies[0].id);
  }
};
