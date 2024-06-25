import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback, useState } from "react";
import { useIsCurrencySupported } from "./useIsCurrencySupported";
import { useSwapLiveConfig } from "./useSwapLiveConfig";

type Props = {
  currencyFrom?: CryptoOrTokenCurrency;
};

export function useIsSwapLiveApp({ currencyFrom }: Props) {
  const ptxSwapLiveApp = useSwapLiveConfig();
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
