import { useCallback, useMemo, useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";

export function useMyWalletScreenViewModel() {
  const [isPairing, setIsPairing] = useState(false);
  const isDeviceListEnabled = useFeature("lwmMyWalletDeviceList")?.enabled ?? false;
  const knownDevices = useSelector(knownDevicesSelector);

  const onPairingStateChanged = useCallback((pairing: boolean) => setIsPairing(pairing), []);

  // The device counts that the My Ledger page of SelectDevice2 sent, for the new device list.
  const pageProperties = useMemo(
    () =>
      isDeviceListEnabled
        ? {
            numberOfDevices: knownDevices.length,
            deviceModels: knownDevices.map(device => device.deviceModelId).sort(),
          }
        : {},
    [isDeviceListEnabled, knownDevices],
  );

  return { isPairing, onPairingStateChanged, isDeviceListEnabled, pageProperties };
}

export type MyWalletScreenViewProps = ReturnType<typeof useMyWalletScreenViewModel>;
