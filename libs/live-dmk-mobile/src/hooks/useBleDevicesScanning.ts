import { useEffect, useState } from "react";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { useDeviceManagementKit } from "./useDeviceManagementKit";
import { BleScanningState } from "./BleScanningState";
import { ScannedDevice } from "./ScannedDevice";

export const mapDiscoveredDeviceToScannedDevice = (device: DiscoveredDevice): ScannedDevice => ({
  deviceId: device.id,
  deviceName: device.name,
  wired: false,
  modelId: dmkToLedgerDeviceIdMap[device.deviceModel.model],
  isAlreadyKnown: false,
});

export const useBleDevicesScanning = (enabled: boolean): BleScanningState => {
  const dmk = useDeviceManagementKit();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [scanningBleError, setScanningBleError] = useState<Error | null>(null);

  useEffect(() => {
    if (!dmk) return;
    if (!enabled) return;
    setIsScanning(true);
    const subscription = dmk
      .listenToAvailableDevices({
        transport: rnBleTransportIdentifier,
      })
      .subscribe({
        next: devices => {
          const newDeviceByIds: Record<string, ScannedDevice> = {};
          //Map in record by ID
          devices.forEach(device => {
            const mappedDevice = mapDiscoveredDeviceToScannedDevice(device);
            newDeviceByIds[mappedDevice.deviceId] = mappedDevice;
          });

          setScannedDevices(Object.values(newDeviceByIds));
        },
        error: error => {
          setScanningBleError(error);
          dmk.stopDiscovering();
          setIsScanning(false);
        },
        complete: () => {
          subscription.unsubscribe();
          dmk.stopDiscovering();
          setIsScanning(false);
        },
      });
    return () => {
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
      dmk.stopDiscovering();
      setIsScanning(false);
    };
  }, [dmk, enabled]);

  return {
    scannedDevices,
    scanningBleError,
    isScanning,
  };
};
