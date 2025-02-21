import { useEffect, useState } from "react";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { useDeviceManagementKit } from "./useDeviceManagementKit";
import { Device } from "@ledgerhq/types-devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";

const defaultMapper = (device: DiscoveredDevice): Device => ({
  deviceId: device.id,
  deviceName: `${device.name}`,
  wired: false,
  modelId: `${dmkToLedgerDeviceIdMap[device.deviceModel.model]}`,
  isAlreadyKnown: false,
});

export const useBleDevicesScanning = <T = Device>(
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
    const subscription = dmk.listenToAvailableDevices().subscribe({
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
  }, [dmk]);

  return {
    scannedDevices,
    scanningBleError,
  };
};
