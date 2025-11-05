import { useEffect, useState } from "react";
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
  isAlreadyKnown: false,
});

const BleStatesToAllowScanning = [...UndeterminedBleStates, BleState.PoweredOn];

export const useBleDevicesScanning = (enabled: boolean): BleScanningState => {
  const dmk = useDeviceManagementKit();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [scanningBleError, setScanningBleError] = useState<Error | null>(null);

  const bleState = useBleState(enabled);

  const scanningEnabled = dmk !== null && enabled && BleStatesToAllowScanning.includes(bleState);

  useEffect(() => {
    if (!scanningEnabled) return;
    setIsScanning(true);
    log("useBleDevicesScanning", " useEffect -> calling dmk.listenToAvailableDevices()");
    const subscription = dmk
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
          subscription.unsubscribe();
          dmk.stopDiscovering();
          setIsScanning(false);
          setScannedDevices([]);
        },
        complete: () => {
          log("useBleDevicesScanning", " complete -> unsubscribing and stopping discovery");
          subscription.unsubscribe();
          dmk.stopDiscovering();
          setIsScanning(false);
          setScannedDevices([]);
        },
      });
    return () => {
      log("useBleDevicesScanning", " useEffect cleanup -> unsubscribing and stopping discovery");
      subscription.unsubscribe();
      dmk.stopDiscovering();
      setIsScanning(false);
      setScannedDevices([]);
    };
  }, [scanningEnabled]);

  return {
    scannedDevices,
    scanningBleError,
    isScanning,
  };
};
