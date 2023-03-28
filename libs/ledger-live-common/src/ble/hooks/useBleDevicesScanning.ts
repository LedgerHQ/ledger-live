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
import { HwTransportError, HwTransportErrorType } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { TransportBleDevice, ScannedDevice } from "../types";

export type ScanningBleError = HwTransportError | null;

export type UseBleDevicesScanningResult = {
  scannedDevices: ScannedDevice[];
  scanningBleError: ScanningBleError;
};

export type UseBleDevicesScanningDependencies = {
  bleTransportListen: (
    observer: TransportObserver<
      DescriptorEvent<TransportBleDevice | null>,
      HwTransportError
    >
  ) => TransportSubscription;
};

export type UseBleDevicesScanningOptions = {
  stopBleScanning?: boolean;
  filterByDeviceModelIds?: DeviceModelId[];
  filterOutDevicesByDeviceIds?: DeviceId[];
  restartScanningTimeoutMs?: number;
};

const DEFAULT_DEVICE_NAME = "Device";
const DEFAULT_RESTART_SCANNING_TIMEOUT_MS = 4000;

/**
 * Scans the BLE devices around the user
 *
 * Warning: if a communication is started with a device, the scanning should be stopped
 *
 * Warning: handling of bluetooth (and location for Android) permissions and enabling bluetooth (and location) services are not handled here.
 * They should be handled (with fallback logic) by the consumer of this hook.
 *
 * Reason: depending on the bleTransportListen function and the user's operating system, errors related to denied bluetooth (and location for Android) permissions
 * or related to disabled bluetooth (and location) services might be different.
 * For ex:
 * - on Android, using the current Transport from react-native-hw-transport-ble, if the bluetooth is off,
 *  a BluetoothScanStartFailed error is thrown, not an actual "BluetoothOff" or "BluetoothUnauthorized" error.
 *  It is a problem because this BluetoothScanStartFailed error could happen for other reason than the BLE being off.
 *  On the other side, if the location service (needed for Android) is off, an error "LocationServicesDisabled" is thrown.
 *
 * - on iOS, using the current Transport from react-native-hw-transport-ble, if the bluetooth is off, no error is thrown at all.
 *
 * @param bleTransportListen The listen function from an implementation of a BLE transport
 * @param filterByDeviceModelIds An array of device model ids to filter on
 * @param filterOutDevicesByDeviceIds An array of device ids to filter out
 * @param stopBleScanning Flag to stop or continue the scanning
 * @param restartScanningTimeoutMs When a restart is needed (on some specific errors, or for the first restart
 * that makes the scanning more resilient to a previously paired device with which a communication was happening),
 * time in ms after which the restart is actually happening
 * @returns An object containing:
 * - scannedDevices: list of ScannedDevice found by the scanning
 * - scanningBleError: if an error occurred, a BleError, otherwise null
 */
export const useBleDevicesScanning = ({
  bleTransportListen,
  stopBleScanning,
  filterByDeviceModelIds,
  filterOutDevicesByDeviceIds,
  restartScanningTimeoutMs = DEFAULT_RESTART_SCANNING_TIMEOUT_MS,
}: UseBleDevicesScanningDependencies &
  UseBleDevicesScanningOptions): UseBleDevicesScanningResult => {
  const [scanningBleError, setScanningBleError] =
    useState<ScanningBleError>(null);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  // To check for duplicates. The ref will persist for the full lifetime of the component
  // in which the hook is called, and does not re-trigger the hook when being updated.
  const scannedDevicesRef = useRef<ScannedDevice[]>([]);
  // To stop, call the unsubscribe and cleaning function, and re-run the scanning
  const [restartScanningNonce, setRestartScanningNonce] = useState<number>(0);
  // To request a restart of the scanning
  const [isRestartNeeded, setIsRestartNeeded] = useState<boolean>(true);

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
        error: (error: HwTransportError) => {
          log("useBleDevicesScanning:error", `${error.type}: ${error.message}`);

          if (
            error instanceof HwTransportError &&
            error.type === HwTransportErrorType.BluetoothScanStartFailed
          ) {
            setIsRestartNeeded(true);
          }

          setScanningBleError(error);
        },
      });

    return () => {
      sub.unsubscribe();
    };
  }, [
    restartScanningNonce,
    bleTransportListen,
    stopBleScanning,
    filterByDeviceModelIds,
    filterOutDevicesByDeviceIds,
  ]);

  // Triggers after a defined time a restart of the scanning if needed
  useEffect(() => {
    let timer;
    if (isRestartNeeded && !stopBleScanning) {
      timer = setTimeout(() => {
        setRestartScanningNonce((prev) => prev + 1);
        setIsRestartNeeded(false);
      }, restartScanningTimeoutMs);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isRestartNeeded, restartScanningTimeoutMs, stopBleScanning]);

  return {
    scannedDevices,
    scanningBleError,
  };
};
