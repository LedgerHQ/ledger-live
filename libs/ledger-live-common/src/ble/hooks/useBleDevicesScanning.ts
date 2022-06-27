import { useState, useEffect, useRef } from "react";
import { Observable, of } from "rxjs";
import { concatAll } from "rxjs/operators";
import { getInfosForServiceUuid } from "@ledgerhq/devices";
import type { DeviceModel, DeviceModelId } from "@ledgerhq/devices";
import type {
  Observer as TransportObserver,
  Subscription as TransportSubscription,
  DescriptorEvent,
  DescriptorEventType,
} from "@ledgerhq/hw-transport";

// Should be exported from somewhere else
export type TransportBleDevice = {
  // Device identifier: MAC address on Android and UUID on iOS.
  id: string;
  // Device name
  name: string | null;
  // User friendly name of device.
  localName: string | null;
  // Current Received Signal Strength Indication of device
  rssi: number | null;
  // Current Maximum Transmission Unit for this device.
  // When device is not connected default value of 23 is used.
  mtu: number;
  // List of available services visible during scanning.
  serviceUUIDs: string[] | null;
  // Allows any other properties
  [otherOptions: string]: unknown;
};

export type ScannedDevice = {
  deviceId: string;
  deviceName: string;
  bleRssi: number | null;
  deviceModel: DeviceModel;
};

export type UseBleDevicesScanningResult = {
  scannedDevices: ScannedDevice[];
  scanningTimedOut: boolean;
  scanningError: Error | null;
};

export type UseBleDevicesScanningDependencies = {
  bleTransportListen: (
    observer: TransportObserver<DescriptorEvent<TransportBleDevice | null>>
  ) => TransportSubscription;
};

export type UseBleDevicesScanningOptions = {
  filterByModelIds?: DeviceModelId[];
  filterOutDeviceIds?: string[];
  timeoutMs?: number;
};

// FIXME: The error coming from listen should be mapped to a BleScanningError
// and having a property errorCode with defined possible error code
export type BleScanningError = any;

const DEFAULT_DEVICE_NAME = "Device";

/**
 * Scans the BLE devices around the user
 * @param filterByModelIds An array of model ids to filter on
 * @param filterOutDeviceIds An array of device ids to filter out
 * @param timeoutMs todo
 * @returns todo
 */
export const useBleDevicesScanning = ({
  bleTransportListen,
  filterByModelIds,
  filterOutDeviceIds,
  timeoutMs = 2000,
}: UseBleDevicesScanningDependencies &
  UseBleDevicesScanningOptions): UseBleDevicesScanningResult => {
  const [scanningTimedOut, setScanningTimedOut] = useState<boolean>(false);
  const [scanningError, setScanningError] = useState<BleScanningError | null>(
    null
  );
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  // To check for duplicates. The ref will persist for the full lifetime of the component
  // in which the hook is called.
  // We could use the current value of scannedDevices inside setScannedDevices
  // but the check would only be done at the end of the process when calling setScannedDevices.
  const scannedDevicesRef = useRef<ScannedDevice[]>([]);

  useEffect(() => {
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
        error: (error: any) => {
          setScanningError(error);
        },
      });

    return () => {
      sub.unsubscribe();
      clearTimeout(timeout);
    };
  }, [bleTransportListen, filterByModelIds, setScannedDevices, timeoutMs]);

  return {
    scannedDevices,
    scanningTimedOut,
    scanningError,
  };
};
