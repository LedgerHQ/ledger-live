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
  enabled: boolean,
  {
    mapper = defaultMapper,
    filterByDeviceModelIds = [],
    filterOutDevicesByDeviceIds = [],
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
    if (!enabled) return;
    const subscription = dmk
      .listenToAvailableDevices({
        transport: rnBleTransportIdentifier,
      })
      .subscribe({
        next: devices => {
          const newDeviceByIds: Record<string, Device> = {};
          //Map in record by ID
          devices.forEach(device => {
            const mappedDevice: Device = mapper(device);
            newDeviceByIds[mappedDevice.deviceId] = mappedDevice;
          });

          //filter devices by model or by id
          Object.keys(newDeviceByIds).forEach(deviceId => {
            //Remove if we need to avoid to list device of model given
            if (
              filterByDeviceModelIds.length > 0 &&
              !filterByDeviceModelIds.includes(newDeviceByIds[deviceId].modelId)
            ) {
              delete newDeviceByIds[deviceId];
            }
            //Remove if we need to avoid to list device already known by ID
            else if (filterOutDevicesByDeviceIds.length > 0) {
              // filter out devices by id
              if (filterOutDevicesByDeviceIds.includes(newDeviceByIds[deviceId].deviceId)) {
                delete newDeviceByIds[deviceId];
              }
            }
          });

          setScannedDevicesById(newDeviceByIds);
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
  }, [dmk, enabled]);

  return {
    scannedDevices: Object.values(scannedDevicesById),
    scanningBleError,
  };
};
