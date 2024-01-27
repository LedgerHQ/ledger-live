import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature } from "../../../../featureFlags";
import { useIsCurrencySupported } from "./useIsCurrencySupported";
import { useCallback, useState } from "react";

type Props = {
  currencyFrom?: CryptoOrTokenCurrency;
};

export function useIsSwapLiveApp({ currencyFrom }: Props) {
  const ptxSwapLiveApp = useFeature("ptxSwapLiveAppDemoZero");
  const [crashed, setHasCrashed] = useState(false);

  const onLiveAppCrashed = useCallback(() => setHasCrashed(true), []);

  const isEnabled = !!ptxSwapLiveApp?.enabled;
  const { families, currencies } = ptxSwapLiveApp?.params ?? {};

  const isCurrencySupported = useIsCurrencySupported({
    params: {
      families,
      currencies,
    },
    currencyFrom,
    defaultValue: !!isEnabled,
  });

  const liveAppAvailable = Boolean(isEnabled && isCurrencySupported && !crashed);

  return {
    enabled: liveAppAvailable,
    onLiveAppCrashed,
  };
}
