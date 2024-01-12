import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { isCryptoCurrency } from "../../../../currencies";

type UseIsCurrencySupportedProps = {
  currencyFrom?: CryptoOrTokenCurrency;
  params: {
    families?: Array<string>;
    currencies?: Array<string>;
  };
  defaultValue: boolean;
};

export function useIsCurrencySupported({
  currencyFrom,
  params,
  defaultValue,
}: UseIsCurrencySupportedProps) {
  const { families, currencies } = params || {};

  if (!currencyFrom || (!families && !currencies)) {
    return defaultValue;
  }

  const familyOfCurrencyFrom = isCryptoCurrency(currencyFrom)
    ? currencyFrom.family
    : currencyFrom.parentCurrency.family;

  const familyOrCurrencyIsEnabled =
    families?.includes(familyOfCurrencyFrom) || currencies?.includes(currencyFrom.id);

  // if families or currencies are defined then check if a family or currency is
  // enabled. If neither of these are defined or of length 0 then assume everything is enabled.
  return families?.length || currencies?.length ? familyOrCurrencyIsEnabled : true;
}
