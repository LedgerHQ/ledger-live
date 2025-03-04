import { useEffect, useState } from "react";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Device } from "@ledgerhq/types-devices";
import { useDeviceManagementKit } from "./useDeviceManagementKit";

const defaultMapper = (device: DiscoveredDevice): Device => ({
  deviceId: device.id,
  deviceName: `${device.name}`,
  wired: false,
  modelId: `${dmkToLedgerDeviceIdMap[device.deviceModel.model]}`,
  isAlreadyKnown: false,
});

export const useBleDevicesScanning = <T = Device>(
  enabled: boolean = false,
  {
    mapper,
  }: {
    mapper: (device: DiscoveredDevice) => T;
  } = { mapper: defaultMapper },
) => {
  const dmk = useDeviceManagementKit();
  const [scannedDevices, setScannedDevices] = useState<T[]>([]);
  const [scanningBleError, setScanningBleError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const subscription = dmk
      .listenToAvailableDevices({
        // NOTE: useBleDeviceScanning should only scan using BLE Transports
        transport: rnBleTransportIdentifier,
      })
      .subscribe({
        next: devices => setScannedDevices(devices.map(mapper)),
        error: error => {
          dmk.stopDiscovering();
          setScanningBleError(error);
        },
        complete: () => {
          dmk.stopDiscovering();
          subscription.unsubscribe();
        },
      });
    return () => {
      dmk.stopDiscovering();
      subscription.unsubscribe();
    };
  }, [dmk, enabled]);

  return {
    scannedDevices,
    scanningBleError,
  };
};
