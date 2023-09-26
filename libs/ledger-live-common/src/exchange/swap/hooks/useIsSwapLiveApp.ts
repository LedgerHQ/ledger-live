import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature } from "../../../featureFlags";
import { isCryptoCurrency } from "../../../currencies";
import { useCallback } from "react";

type Props = {
  currencyTo?: CryptoOrTokenCurrency;
};

export function useIsSwapLiveApp({ currencyTo }: Props) {
  const ptxSwapLiveApp = useFeature("ptxSwapLiveApp");
  const { families, currencies } = ptxSwapLiveApp.params || {};

  const isEnabled = useCallback(
    (flag: boolean) => ptxSwapLiveApp.enabled && flag,
    [ptxSwapLiveApp.enabled],
  );

  if (!currencyTo || (!families && !currencies)) {
    return ptxSwapLiveApp.enabled;
  }

  const familyOfCurrencyTo = isCryptoCurrency(currencyTo)
    ? currencyTo.family
    : currencyTo.parentCurrency.family;

  const familyIsEnabled = families?.length ? families.includes(familyOfCurrencyTo) : true;
  const currencyIsEnabled = currencies?.length ? currencies.includes(currencyTo.id) : true;

  return isEnabled(familyIsEnabled || currencyIsEnabled);
}
