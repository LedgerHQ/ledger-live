import { useDeviceManagementKit } from "./useDeviceManagementKit";
import { useEffect, useState } from "react";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";

export const useBleDevicesScanning = <T = DiscoveredDevice>(
  {
    mapper,
  }: {
    mapper: (device: DiscoveredDevice) => T;
  } = { mapper: d => d as T },
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
