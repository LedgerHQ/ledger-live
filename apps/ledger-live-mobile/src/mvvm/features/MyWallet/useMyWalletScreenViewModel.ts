import { useCallback, useState } from "react";
import { useFeature } from "@features/platform-feature-flags";

export function useMyWalletScreenViewModel() {
  const [isPairing, setIsPairing] = useState(false);
  const isDeviceListEnabled = useFeature("lwmMyWalletDeviceList")?.enabled ?? false;

  const onPairingStateChanged = useCallback((pairing: boolean) => setIsPairing(pairing), []);

  return { isPairing, onPairingStateChanged, isDeviceListEnabled };
}

export type MyWalletScreenViewProps = ReturnType<typeof useMyWalletScreenViewModel>;
