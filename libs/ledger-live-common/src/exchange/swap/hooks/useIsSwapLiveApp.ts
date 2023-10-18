import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature } from "../../../featureFlags";
import { isCryptoCurrency } from "../../../currencies";

type Props = {
  currencyFrom?: CryptoOrTokenCurrency;
};

export function useIsSwapLiveApp({ currencyFrom }: Props) {
  const ptxSwapLiveApp = useFeature("ptxSwapLiveApp");
  const { families, currencies } = ptxSwapLiveApp?.params || {};

  if (!currencyFrom || (!families && !currencies)) {
    return ptxSwapLiveApp?.enabled;
  }

  const familyOfCurrencyFrom = isCryptoCurrency(currencyFrom)
    ? currencyFrom.family
    : currencyFrom.parentCurrency.family;

  const familyIsEnabled = families?.length ? families.includes(familyOfCurrencyFrom) : true;
  const currencyIsEnabled = currencies?.length ? currencies.includes(currencyFrom.id) : true;

  return ptxSwapLiveApp?.enabled && (familyIsEnabled || currencyIsEnabled);
}
