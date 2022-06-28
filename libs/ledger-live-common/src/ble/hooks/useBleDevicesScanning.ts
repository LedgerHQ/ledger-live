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

// Inspired by Device class from react-native-ble-plx
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

// Inspired by BleError class from react-native-ble-plx
// BleError should be an error class which is guaranteed to be thrown by all functions
// by our different implementations of Transport or at least of ble implementation of Transport
// TODO: BleError as a class
export type BleError = Error & {
  // Platform independent error code.
  // It is defined as an enum named BleErrorCode in react-native-ble-plx
  // We should have our own mapping
  errorCode: number;
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
  scanningBleError: BleError | null;
};

export type UseBleDevicesScanningDependencies = {
  bleTransportListen: (
    observer: TransportObserver<DescriptorEvent<TransportBleDevice | null>>
  ) => TransportSubscription;
};

export type UseBleDevicesScanningOptions = {
  stopBleScanning?: boolean;
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
  stopBleScanning,
  filterByModelIds,
  filterOutDeviceIds,
  timeoutMs = 2000,
}: UseBleDevicesScanningDependencies &
  UseBleDevicesScanningOptions): UseBleDevicesScanningResult => {
  const [scanningTimedOut, setScanningTimedOut] = useState<boolean>(false);
  const [scanningBleError, setScanningBleError] = useState<BleError | null>(
    null
  );
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
      console.log("🧹 unsubscribing !");
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
