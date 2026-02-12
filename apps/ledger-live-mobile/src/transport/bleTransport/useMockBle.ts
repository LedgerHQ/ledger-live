import { useCallback, useEffect, useState } from "react";
import { BleScanningState, ScannedDevice } from "@ledgerhq/live-dmk-mobile";
import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { Subscription } from "@ledgerhq/hw-transport";
import getBLETransport from "./index";

/**
 * Mock hook for BLE device scanning in e2e tests.
 *
 * Uses the mock transport's `listen()` method (from `makeMock.ts`) which subscribes to
 * `e2eBridgeClient` for "add" events sent by the test runner via `addDevicesBT()`.
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
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);

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
          const { id, name } = event.descriptor;
          const newDevice: ScannedDevice = {
            deviceId: id,
            deviceName: name,
            wired: false,
            modelId: DeviceModelId.nanoX,
            discoveredDevice: {
              id,
              name,
              deviceModel: {
                id: DmkDeviceModelId.NANO_X,
                model: DmkDeviceModelId.NANO_X,
                name: "Nano X",
              },
              transport: "BLE",
            },
          };

          setScannedDevices(prev => {
            const exists = prev.some(d => d.deviceId === id);
            if (exists) return prev;
            return [...prev, newDevice];
          });
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
