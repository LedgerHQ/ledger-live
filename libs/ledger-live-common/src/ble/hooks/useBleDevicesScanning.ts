import { useState, useEffect } from "react";
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
  const [scanningError, setScanningError] = useState<Error | null>(null);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("TimedOut");
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

          if (type === "remove") {
            console.log(`📡 A remove: ${JSON.stringify(event)}`);
          }

          if (type === "add" && descriptor) {
            clearTimeout(timeout);

            const transportDevice = descriptor;

            // To avoid duplicates
            if (scannedDevices.some((d) => d.deviceId === transportDevice.id)) {
              return;
            }

            console.log(
              `📡 Found a new device: ${transportDevice.id} <- with already ${
                scannedDevices.length
              } = ${JSON.stringify(scannedDevices)}`
            );

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

              console.log({ bleInfo });

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
            }
          }
        },
        error: (error: Error) => {
          // eslint-disable-next-line no-console
          console.log(`Error: ${JSON.stringify(error)}`);
          setScanningError(error);
        },
      });

    return () => {
      sub.unsubscribe();
      clearTimeout(timeout);
    };
    // The useEffect should not be updated when scannedDevices is updated
    // in order to be able to check scannedDevices when receiving a new event
    // from the ble scanning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bleTransportListen, setScannedDevices, timeoutMs]);

  return {
    scannedDevices,
    scanningTimedOut,
    scanningError,
  };
};
