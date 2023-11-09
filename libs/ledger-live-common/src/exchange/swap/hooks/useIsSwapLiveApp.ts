import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature } from "../../../featureFlags";
import { isCryptoCurrency } from "../../../currencies";

type Props = {
  currencyFrom?: CryptoOrTokenCurrency;
  swapWebManifestId: string;
};

export function useIsSwapLiveApp({ currencyFrom, swapWebManifestId }: Props) {
  const ptxSwapLiveApp = useFeature("ptxSwapLiveApp");

  const flagConfig =
    ptxSwapLiveApp && ptxSwapLiveApp[swapWebManifestId]
      ? ptxSwapLiveApp[swapWebManifestId]
      : ptxSwapLiveApp;

  const { enabled, params } = flagConfig || {};
  const { families, currencies } = params || {};

  if (!currencyFrom || (!families && !currencies)) {
    return enabled;
  }

  const familyOfCurrencyFrom = isCryptoCurrency(currencyFrom)
    ? currencyFrom.family
    : currencyFrom.parentCurrency.family;

  const familyIsEnabled = families?.length ? families.includes(familyOfCurrencyFrom) : true;
  const currencyIsEnabled = currencies?.length ? currencies.includes(currencyFrom.id) : true;

  return enabled && (familyIsEnabled || currencyIsEnabled);
}
