import { useState, useEffect, useRef } from "react";
import { Observable, of } from "rxjs";
import { concatAll } from "rxjs/operators";
import { getInfosForServiceUuid } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/devices";
import type {
  Observer as TransportObserver,
  Subscription as TransportSubscription,
  DescriptorEvent,
  DescriptorEventType,
} from "@ledgerhq/hw-transport";
import { TransportBleDevice, ScannedDevice, BleError } from "../types";

export type ScanningBleError = BleError | null;

export type UseBleDevicesScanningResult = {
  scannedDevices: ScannedDevice[];
  scanningTimedOut: boolean;
  scanningBleError: ScanningBleError;
};

export type UseBleDevicesScanningDependencies = {
  bleTransportListen: (
    observer: TransportObserver<DescriptorEvent<TransportBleDevice | null>>
  ) => TransportSubscription;
};

export type UseBleDevicesScanningOptions = {
  stopBleScanning?: boolean;
  filterByModelIds?: DeviceModelId[];
  timeoutMs?: number;
};

const DEFAULT_DEVICE_NAME = "Device";

/**
 * Scans the BLE devices around the user
 * @param filterByModelIds An array of model ids to filter on
 * @param timeoutMs todo
 * @returns todo
 */
export const useBleDevicesScanning = ({
  bleTransportListen,
  stopBleScanning,
  filterByModelIds,
  timeoutMs = 2000,
}: UseBleDevicesScanningDependencies &
  UseBleDevicesScanningOptions): UseBleDevicesScanningResult => {
  const [scanningTimedOut, setScanningTimedOut] = useState<boolean>(false);
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

    // TODO: define timeout and stop the scanning
    const timeout = setTimeout(() => {
      setScanningTimedOut(true);
    }, timeoutMs);

    const bleScanningSource = new Observable(bleTransportListen);

    // Concat to flatten the events emitted by the scanning, that could arrive to fast
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
            clearTimeout(timeout);

            const transportDevice = descriptor;

            // To avoid duplicates
            if (
              scannedDevicesRef.current.some(
                (d) => d.deviceId === transportDevice.id
              )
            ) {
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
                filterByModelIds &&
                !filterByModelIds.includes(bleInfo.deviceModel.id)
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
      clearTimeout(timeout);
    };
  }, [
    bleTransportListen,
    stopBleScanning,
    filterByModelIds,
    setScannedDevices,
    timeoutMs,
  ]);

  return {
    scannedDevices,
    scanningTimedOut,
    scanningBleError,
  };
};
