import { useState, useEffect, useRef } from "react";
import { Observable, of } from "rxjs";
import { concatAll } from "rxjs/operators";
import { getInfosForServiceUuid } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type {
  Observer as TransportObserver,
  Subscription as TransportSubscription,
  DescriptorEvent,
  DescriptorEventType,
} from "@ledgerhq/hw-transport";
import { DeviceId } from "@ledgerhq/types-live";
import { TransportBleDevice, ScannedDevice, BleError } from "../types";

export type ScanningBleError = BleError | null;

export type UseBleDevicesScanningResult = {
  scannedDevices: ScannedDevice[];
  scanningBleError: ScanningBleError;
};

export type UseBleDevicesScanningDependencies = {
  bleTransportListen: (
    observer: TransportObserver<DescriptorEvent<TransportBleDevice | null>>
  ) => TransportSubscription;
};

export type UseBleDevicesScanningOptions = {
  stopBleScanning?: boolean;
  filterByDeviceModelIds?: DeviceModelId[];
  filterOutDevicesByDeviceIds?: DeviceId[];
};

const DEFAULT_DEVICE_NAME = "Device";

/**
 * Scans the BLE devices around the user
 * @param filterByDeviceModelIds An array of device model ids to filter on
 * @param filterOutDevicesByDeviceIds An array of device ids to filter out
 * @param stopBleScanning Flag to stop or continue the scanning
 * @returns An object containing:
 * - scannedDevices: list of ScannedDevice found by the scanning
 * - scanningBleError: if an error occurred, a BleError, otherwise null
 */
export const useBleDevicesScanning = ({
  bleTransportListen,
  stopBleScanning,
  filterByDeviceModelIds,
  filterOutDevicesByDeviceIds,
}: UseBleDevicesScanningDependencies &
  UseBleDevicesScanningOptions): UseBleDevicesScanningResult => {
  const [scanningBleError, setScanningBleError] =
    useState<ScanningBleError>(null);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  // To check for duplicates. The ref will persist for the full lifetime of the component
  // in which the hook is called.
  // We could use the current value of scannedDevices inside setScannedDevices
  // but the check would only be done at the end of the process when calling setScannedDevices.
  const scannedDevicesRef = useRef<ScannedDevice[]>([]);

  useEffect(() => {
    if (stopBleScanning) {
      return;
    }

    const bleScanningSource = new Observable(bleTransportListen);

    // Concat to flatten the events emitted by the scanning, that could arrive too fast
    const sub = of(bleScanningSource)
      .pipe(concatAll())
      .subscribe({
        next: (event: {
          type: DescriptorEventType;
          descriptor?: TransportBleDevice | null;
        }) => {
          setScanningBleError(null);
          const { type, descriptor } = event;
          if (type === "flush") {
            setScannedDevices([]);
          } else if (type === "add" && descriptor) {
            const transportDevice = descriptor;

            const isScannedDeviceDuplicate = scannedDevicesRef.current.some(
              (d) => d.deviceId === transportDevice.id
            );

            // Avoiding duplicates
            if (isScannedDeviceDuplicate) {
              return;
            }

            const shouldScannedDeviceBeFilteredOut =
              filterOutDevicesByDeviceIds?.some(
                (deviceId) => deviceId === transportDevice.id
              );

            if (shouldScannedDeviceBeFilteredOut) {
              return;
            }

            if (
              transportDevice.serviceUUIDs &&
              transportDevice.serviceUUIDs.length > 0
            ) {
              const bleInfo = getInfosForServiceUuid(
                transportDevice.serviceUUIDs[0]
              );

              if (!bleInfo) {
                return;
              }

              // Filters on the model ids, if asked
              if (
                filterByDeviceModelIds &&
                !filterByDeviceModelIds.includes(bleInfo.deviceModel.id)
              ) {
                return;
              }

              const newScannedDevice = {
                deviceModel: bleInfo.deviceModel,
                deviceName:
                  transportDevice.localName ??
                  transportDevice.name ??
                  DEFAULT_DEVICE_NAME,
                deviceId: transportDevice.id,
                bleRssi: transportDevice.rssi,
              };

              setScannedDevices((scannedDevices) => [
                ...scannedDevices,
                newScannedDevice,
              ]);
              scannedDevicesRef.current.push(newScannedDevice);
            }
          }
        },
        error: (error: BleError) => {
          // TODO: we should be sure to have a BleError
          if (error.errorCode) {
            setScanningBleError(error);
          }
        },
      });

    return () => {
      sub.unsubscribe();
    };
  }, [
    bleTransportListen,
    stopBleScanning,
    filterByDeviceModelIds,
    setScannedDevices,
    filterOutDevicesByDeviceIds,
  ]);

  return {
    scannedDevices,
    scanningBleError,
  };
};
