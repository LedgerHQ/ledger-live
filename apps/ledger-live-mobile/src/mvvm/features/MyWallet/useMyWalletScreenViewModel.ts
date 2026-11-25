import { useCallback, useMemo, useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";

export function useMyWalletScreenViewModel() {
  const [isPairing, setIsPairing] = useState(false);
  const isDeviceListEnabled = useFeature("lwmMyWalletDeviceList")?.enabled ?? false;
  const knownDevices = useSelector(knownDevicesSelector);

  const onPairingStateChanged = useCallback((pairing: boolean) => setIsPairing(pairing), []);

  // The device counts that the My Ledger page of SelectDevice2 sent: its Bluetooth known devices, which
  // the new list also always shows. A USB device shows only while it is plugged in.
  const pageProperties = useMemo(() => {
    if (!isDeviceListEnabled) return {};
    const bleKnownDevices = knownDevices.filter(
      device => device.transport === rnBleTransportIdentifier,
    );
    return {
      numberOfDevices: bleKnownDevices.length,
      deviceModels: bleKnownDevices.map(device => device.deviceModelId).sort(),
    };
  }, [isDeviceListEnabled, knownDevices]);

  return { isPairing, onPairingStateChanged, isDeviceListEnabled, pageProperties };
}

export type MyWalletScreenViewProps = ReturnType<typeof useMyWalletScreenViewModel>;
