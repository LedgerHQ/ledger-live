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
  stopAndReRunIntervalMs?: number;
};

const DEFAULT_DEVICE_NAME = "Device";
const DEFAULT_STOP_AND_RERUN_INTERVAL_MS = 2000;

/**
 * Scans the BLE devices around the user
 * @param filterByDeviceModelIds An array of device model ids to filter on
 * @param filterOutDevicesByDeviceIds An array of device ids to filter out
 * @param stopBleScanning Flag to stop or continue the scanning
 * @param stopAndReRunIntervalMs Interval of time in ms at which the scanning is stopped, cleaned and re-run.
 *   It makes the scanning more resilient to a previously paired device with which a communication was happening.
 * @returns An object containing:
 * - scannedDevices: list of ScannedDevice found by the scanning
 * - scanningBleError: if an error occurred, a BleError, otherwise null
 */
export const useBleDevicesScanning = ({
  bleTransportListen,
  stopBleScanning,
  filterByDeviceModelIds,
  filterOutDevicesByDeviceIds,
  stopAndReRunIntervalMs = DEFAULT_STOP_AND_RERUN_INTERVAL_MS,
}: UseBleDevicesScanningDependencies &
  UseBleDevicesScanningOptions): UseBleDevicesScanningResult => {
  const [scanningBleError, setScanningBleError] =
    useState<ScanningBleError>(null);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  // To check for duplicates. The ref will persist for the full lifetime of the component
  // in which the hook is called, and does not re-trigger the hook when being updated.
  const scannedDevicesRef = useRef<ScannedDevice[]>([]);
  // To stop, call the unsubscribe and cleaning function, and re-run
  const [stopAndReRun, setCleanAndReRun] = useState<0 | 1>(0);

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
          descriptor: TransportBleDevice | null;
        }) => {
          setScanningBleError(null);
          const { type, descriptor } = event;

          if (type === "add" && descriptor) {
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
    stopAndReRun,
    bleTransportListen,
    stopBleScanning,
    filterByDeviceModelIds,
    filterOutDevicesByDeviceIds,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCleanAndReRun((prev) => {
        return prev === 1 ? 0 : 1;
      });
    }, stopAndReRunIntervalMs);

    return () => clearInterval(interval);
  }, [stopAndReRunIntervalMs]);

  return {
    scannedDevices,
    scanningBleError,
  };
};
