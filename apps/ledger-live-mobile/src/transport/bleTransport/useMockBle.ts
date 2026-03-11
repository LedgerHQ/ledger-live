import { useCallback, useEffect, useMemo, useState } from "react";
import { BleScanningState, ScannedDevice } from "@ledgerhq/live-dmk-mobile";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId, getInfosForServiceUuid } from "@ledgerhq/devices";
import { Subscription } from "@ledgerhq/hw-transport";
import { useSelector } from "~/context/hooks";
import { bleDevicesSelector } from "~/reducers/ble";
import { DeviceLike } from "~/reducers/types";
import { makeMockDiscoveredDevice } from "../mockDiscoveredDevice";
import getBLETransport from "./index";

const mapDeviceToScannedDevice = (device: Device): ScannedDevice => ({
  ...device,
  deviceName: device.deviceName ?? "",
  discoveredDevice: makeMockDiscoveredDevice(device),
});

const mapKnownDeviceToScannedDevice = (device: DeviceLike): ScannedDevice =>
  mapDeviceToScannedDevice({
    deviceId: device.id,
    deviceName: device.name,
    modelId: device.modelId,
    wired: false,
  });

const mapDescriptorToScannedDevice = ({
  id,
  name,
  serviceUUID,
}: {
  id: string;
  name: string;
  serviceUUID: string;
}): ScannedDevice => {
  const modelId = getInfosForServiceUuid(serviceUUID)?.deviceModel.id ?? DeviceModelId.nanoX;

  return mapDeviceToScannedDevice({
    deviceId: id,
    deviceName: name,
    modelId,
    wired: false,
  });
};

const mergeScannedDevices = (...deviceLists: ScannedDevice[][]): ScannedDevice[] => {
  const mergedDevices = new Map<string, ScannedDevice>();

  deviceLists.forEach(devices => {
    devices.forEach(device => {
      mergedDevices.set(device.deviceId, device);
    });
  });

  return Array.from(mergedDevices.values());
};

/**
 * Mock hook for BLE device scanning in e2e tests.
 *
 * Uses the mock transport's `listen()` method (from `makeMock.ts`) which subscribes to
 * `e2eBridgeClient` for "add" events sent by the test runner via `addDevicesBT()`.
 * It also exposes imported `knownDevices` as scanned devices so remembered mock BLE devices
 * stay selectable in Detox flows.
 *
 * @param enabled - Whether scanning is currently enabled
 * @returns BleScanningState with scanned devices
 *
 * @example
 * // In e2e test (server side):
 * await app.common.addDeviceViaBluetooth();
 *
 * // This triggers in server.ts:
 * bridge.addDevicesBT({ id: "...", name: "...", serviceUUID: "..." });
 *
 * // Which sends an "add" message that makeMock.listen receives
 */
export const useMockBleDevicesScanning = (enabled: boolean): BleScanningState => {
  const knownDevices = useSelector(bleDevicesSelector);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const knownScannedDevices = useMemo(
    () => knownDevices.map(mapKnownDeviceToScannedDevice),
    [knownDevices],
  );

  useEffect(() => {
    if (!enabled) {
      setScannedDevices([]);
      return;
    }

    let subscription: Subscription | null = null;

    // Use the mock transport's listen method which subscribes to e2eBridgeClient
    subscription = getBLETransport().listen({
      next: event => {
        if (event.type === "add" && event.descriptor) {
          const newDevice = mapDescriptorToScannedDevice(event.descriptor);
          setScannedDevices(prev => mergeScannedDevices(prev, [newDevice]));
        }
      },
      error: () => {},
      complete: () => {},
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [enabled]);

  const mergedScannedDevices = useMemo(
    () => (enabled ? mergeScannedDevices(knownScannedDevices, scannedDevices) : []),
    [enabled, knownScannedDevices, scannedDevices],
  );

  return {
    scannedDevices: mergedScannedDevices,
    scanningBleError: null,
    isScanning: enabled,
  };
};

/**
 * Mock hook for BLE device pairing in e2e tests.
 *
 * Uses the mock transport's `open()` method (from `makeMock.ts`) which waits for an "open"
 * event from `e2eBridgeClient` (sent by the test runner via `bridge.open()`) to simulate
 * a successful pairing. Returns the same interface as the real `useBleDevicePairing` hook.
 *
 * @param device - The device to pair with
 * @returns Object with isPaired state and potential pairingError
 *
 * @example
 * // In e2e test (server side):
 * await app.common.addDeviceViaBluetooth();
 *
 * // This triggers in server.ts after addDevicesBT:
 * bridge.open();
 *
 * // Which sends an "open" message that makeMock.open receives to complete pairing
 */
export const useMockBleDevicePairing = ({
  device,
  enabled = true,
}: {
  device: Device;
  enabled?: boolean;
}) => {
  const [isPaired, setIsPaired] = useState(false);
  const [pairingError, setPairingError] = useState<Error | null>(null);

  const connectMockDevice = useCallback(async () => {
    try {
      // Use the mock transport's open method which waits for "open" from e2eBridgeClient
      await getBLETransport().open(device.deviceId);
      setIsPaired(true);
    } catch (error) {
      setPairingError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [device.deviceId]);

  useEffect(() => {
    if (enabled && device) {
      connectMockDevice();
    }
  }, [enabled, device, connectMockDevice]);

  return { isPaired, pairingError };
};
