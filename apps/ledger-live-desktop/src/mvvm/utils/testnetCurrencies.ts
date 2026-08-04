import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
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
