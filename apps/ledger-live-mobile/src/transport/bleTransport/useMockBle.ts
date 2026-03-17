import { useCallback, useEffect, useState } from "react";
import { BleScanningState, ScannedDevice } from "@ledgerhq/live-dmk-mobile";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId, getInfosForServiceUuid } from "@ledgerhq/devices";
import { BehaviorSubject } from "rxjs";
import { e2eBridgeClient } from "../../../e2e/bridge/client";
import { makeMockDiscoveredDevice } from "../mockDiscoveredDevice";
import getBLETransport from "./index";

const mapDeviceToScannedDevice = (device: Device): ScannedDevice => ({
  ...device,
  deviceName: device.deviceName ?? "",
  discoveredDevice: makeMockDiscoveredDevice(device),
});

type MockBleDescriptor = {
  id: string;
  name: string;
  serviceUUID?: string;
  serviceUUIDs?: string[];
};

type MockBleBridgeMessage =
  | {
      type: "add";
      payload: MockBleDescriptor;
    }
  | {
      type: "importBle";
    };

const mapDescriptorToScannedDevice = ({
  id,
  name,
  serviceUUID,
  serviceUUIDs,
}: MockBleDescriptor): ScannedDevice => {
  const resolvedServiceUUID = serviceUUID ?? serviceUUIDs?.[0];
  const modelId = resolvedServiceUUID
    ? getInfosForServiceUuid(resolvedServiceUUID)?.deviceModel.id ?? DeviceModelId.nanoX
    : DeviceModelId.nanoX;

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

const mockBleScannedDevices = new BehaviorSubject<ScannedDevice[]>([]);

const handleMockBleBridgeMessage = (msg: MockBleBridgeMessage) => {
  if (msg.type === "add") {
    const newDevice = mapDescriptorToScannedDevice(msg.payload);
    mockBleScannedDevices.next(mergeScannedDevices(mockBleScannedDevices.getValue(), [newDevice]));
  }

  if (msg.type === "importBle") {
    mockBleScannedDevices.next([]);
  }
};

export const __testUtils = {
  emitMockBleBridgeMessage: handleMockBleBridgeMessage,
  resetMockBleScannedDevices: () => mockBleScannedDevices.next([]),
};

/**
 * Mock hook for BLE device scanning in e2e tests.
 *
 * Subscribes directly to `e2eBridgeClient` for "add" events sent by the
 * test runner via `addDevicesBT()`.
 *
 * Emitted scan events are retained across screen mounts until a new BLE state is imported.
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
 * // Which sends an "add" message that this hook receives via e2eBridgeClient
 */
export const useMockBleDevicesScanning = (enabled: boolean): BleScanningState => {
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>(() =>
    enabled ? mockBleScannedDevices.getValue() : [],
  );

  useEffect(() => {
    if (!enabled) {
      setScannedDevices([]);
      return;
    }

    setScannedDevices(mockBleScannedDevices.getValue());
    const scannedDevicesSubscription = mockBleScannedDevices.subscribe(setScannedDevices);
    const bridgeSubscription = e2eBridgeClient.subscribe(msg => {
      if (msg.type === "add") {
        handleMockBleBridgeMessage({
          type: "add",
          payload: msg.payload,
        });
      }

      if (msg.type === "importBle") {
        handleMockBleBridgeMessage({
          type: "importBle",
        });
      }
    });

    return () => {
      scannedDevicesSubscription.unsubscribe();
      bridgeSubscription.unsubscribe();
    };
  }, [enabled]);

  return {
    scannedDevices,
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
