import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { useIsCurrencySupported } from "./useIsCurrencySupported";
import { useCallback, useState } from "react";

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

  const isCurrencySupported = useIsCurrencySupported({
    params,
    currencyFrom,
    defaultValue: enabled,
  });

  const [crashed, setHasCrashed] = useState(false);
  const onLiveAppCrashed = useCallback(() => setHasCrashed(true), []);

  const liveAppAvailable = Boolean(enabled && isCurrencySupported && !crashed);

  return {
    enabled: liveAppAvailable,
    onLiveAppCrashed,
  };
}
