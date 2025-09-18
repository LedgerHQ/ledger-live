import { listSupportedCurrencies } from "@ledgerhq/coin-framework/currencies/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import uniqBy from "lodash/uniqBy";

export const getTestnetCurrencies = (
  currencies?: CryptoOrTokenCurrency[],
): CryptoOrTokenCurrency[] => {
  const currenciesToFilter = currencies || listSupportedCurrencies();

  return currenciesToFilter.filter(
    currency => currency.type === "CryptoCurrency" && currency.isTestnetFor,
  );
};

export const addTestnetCurrencies = (
  currencies?: CryptoOrTokenCurrency[],
): CryptoOrTokenCurrency[] => {
  const baseCurrencies = currencies || [];
  const testNetCurrencies = getTestnetCurrencies();

  return uniqBy([...baseCurrencies, ...testNetCurrencies], "id");
};
