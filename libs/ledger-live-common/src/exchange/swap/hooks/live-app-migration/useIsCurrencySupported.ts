import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { isCryptoCurrency } from "../../../../currencies";

type UseIsCurrencySupportedProps = {
  currencyFrom?: CryptoOrTokenCurrency;
  params: {
    families: string;
    currencies: Array<unknown>;
  };
};

export function useIsCurrencySupported({ currencyFrom, params }: UseIsCurrencySupportedProps) {
  const { families, currencies } = params || {};

  if (!currencyFrom || (!families && !currencies)) {
    return false;
  }

  const familyOfCurrencyFrom = isCryptoCurrency(currencyFrom)
    ? currencyFrom.family
    : currencyFrom.parentCurrency.family;

  const familyIsEnabled = families?.length ? families.includes(familyOfCurrencyFrom) : true;
  const currencyIsEnabled = currencies?.length ? currencies.includes(currencyFrom.id) : true;

  return familyIsEnabled || currencyIsEnabled;
}
