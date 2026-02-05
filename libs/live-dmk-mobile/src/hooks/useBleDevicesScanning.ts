import { useEffect, useState } from "react";
import type { Subscription } from "rxjs";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { useDeviceManagementKit } from "./useDeviceManagementKit";
import { BleScanningState } from "./BleScanningState";
import { ScannedDevice } from "./ScannedDevice";
import { log } from "@ledgerhq/logs";
import { BleState, UndeterminedBleStates, useBleState } from "./useBleState";

export const mapDiscoveredDeviceToScannedDevice = (device: DiscoveredDevice): ScannedDevice => ({
  deviceId: device.id,
  deviceName: device.name,
  wired: false,
  modelId: dmkToLedgerDeviceIdMap[device.deviceModel.model],
  discoveredDevice: device,
});

const BleStatesToAllowScanning = [...UndeterminedBleStates, BleState.PoweredOn];
const RETRY_DELAY_MS = 5000; // Delay before retrying after unexpected completion

export const useBleDevicesScanning = (enabled: boolean): BleScanningState => {
  const dmk = useDeviceManagementKit();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [scanningBleError, setScanningBleError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const bleState = useBleState(enabled);

  const scanningEnabled = dmk !== null && enabled && BleStatesToAllowScanning.includes(bleState);

  const setRetryTimeout = () =>
    setTimeout(() => {
      // If scanning is still enabled (user still searching for his device), this is an unexpected completion - retry
      // This can happen when a connected device is disconnected during scanning, and probably in some other edge cases
      log("useBleDevicesScanning", " still enabled after timeout, retrying...");
      setRetryCount(prev => prev + 1);
    }, RETRY_DELAY_MS);

  useEffect(() => {
    if (!scanningEnabled) return;

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let subscription: Subscription | null = null;

    const finalizeScanning = () => {
      if (subscription) {
        subscription.unsubscribe();
        dmk.stopDiscovering();
        subscription = null;
      }
      setIsScanning(false);
      setScannedDevices([]);
    };

    setIsScanning(true);
    setScanningBleError(null);
    log("useBleDevicesScanning", " useEffect -> calling dmk.listenToAvailableDevices()");
    subscription = dmk
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
          log("useBleDevicesScanning", " error", `${error.type}: ${error.message}`);
          log("useBleDevicesScanning", " error -> unsubscribing and stopping discovery");
          finalizeScanning();
          retryTimeout = setRetryTimeout();
        },
        complete: () => {
          log("useBleDevicesScanning", " complete -> unsubscribing and stopping discovery");
          finalizeScanning();
          retryTimeout = setRetryTimeout();
        },
      });
    return () => {
      log("useBleDevicesScanning", " useEffect cleanup -> unsubscribing and stopping discovery");
      finalizeScanning();
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [scanningEnabled, dmk, retryCount]);

  return {
    scannedDevices,
    scanningBleError,
    isScanning,
  };
};
