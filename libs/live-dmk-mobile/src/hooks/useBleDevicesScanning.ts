import { useEffect, useState } from "react";
import { DeviceId, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { useDeviceManagementKit } from "./useDeviceManagementKit";

export const defaultMapper = (device: DiscoveredDevice): Device => ({
  deviceId: device.id,
  deviceName: `${device.name}`,
  wired: false,
  modelId: `${dmkToLedgerDeviceIdMap[device.deviceModel.model]}`,
  isAlreadyKnown: false,
});

export const useBleDevicesScanning = <T = Device>(
  {
    mapper = defaultMapper,
    filterByDeviceModelIds,
    filterOutDevicesByDeviceIds,
  }: {
    mapper?: (device: DiscoveredDevice) => T;
    filterByDeviceModelIds?: DeviceModelId[];
    filterOutDevicesByDeviceIds?: DeviceId[];
  } = { mapper: defaultMapper },
) => {
  const dmk = useDeviceManagementKit();
  const [scannedDevicesById, setScannedDevicesById] = useState<Record<string, T>>({});
  const [scanningBleError, setScanningBleError] = useState<Error | null>(null);

  useEffect(() => {
    if (!dmk) return;
    const subscription = dmk
      .startDiscovering({
        transport: rnBleTransportIdentifier,
      })
      .subscribe({
        next: device => {
          if (
            filterByDeviceModelIds &&
            !filterByDeviceModelIds.includes(dmkToLedgerDeviceIdMap[device.deviceModel.model])
          ) {
            return;
          }

          if (filterOutDevicesByDeviceIds && filterOutDevicesByDeviceIds.includes(device.id)) {
            return;
          }

          setScannedDevicesById(scannedDevicesById => {
            if (scannedDevicesById[device.id] && !device.rssi) {
              delete scannedDevicesById[device.id];
              return { ...scannedDevicesById };
            }
            if (!scannedDevicesById[device.id] && device.rssi) {
              return {
                ...scannedDevicesById,
                [device.id]: mapper(device),
              };
            }
            return scannedDevicesById;
          });
        },
        error: error => {
          setScanningBleError(error);
          dmk.stopDiscovering();
        },
        complete: () => {
          subscription.unsubscribe();
          dmk.stopDiscovering();
        },
      });
    return () => {
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
      dmk.stopDiscovering();
    };
  }, [dmk]);

  return {
    scannedDevices: Object.values(scannedDevicesById),
    scanningBleError,
  };
};
