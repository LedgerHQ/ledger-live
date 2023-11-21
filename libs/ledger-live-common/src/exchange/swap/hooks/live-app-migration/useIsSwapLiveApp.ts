import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature } from "../../../../featureFlags";
import { useIsCurrencySupported } from "./useIsCurrencySupported";
import { useCallback, useState } from "react";

type Props = {
  currencyFrom?: CryptoOrTokenCurrency;
  swapWebManifestId: string;
};

export function useIsSwapLiveApp({ currencyFrom, swapWebManifestId }: Props) {
  const ptxSwapLiveApp = useFeature("ptxSwapLiveApp");

  const enabled = ptxSwapLiveApp?.enabled;
  const params = ptxSwapLiveApp?.params?.[swapWebManifestId]
    ? ptxSwapLiveApp.params?.[swapWebManifestId]
    : {};

  const isCurrencySupported = useIsCurrencySupported({
    params,
    currencyFrom,
  });

  const [crashed, setHasCrashed] = useState(false);
  const onLiveAppCrashed = useCallback(() => setHasCrashed(true), []);

  const liveAppAvailable = Boolean(enabled && isCurrencySupported && !crashed);

  return {
    enabled: liveAppAvailable,
    onLiveAppCrashed,
  };
}
