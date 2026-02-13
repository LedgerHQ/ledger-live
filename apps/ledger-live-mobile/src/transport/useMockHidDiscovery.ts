import { useEffect, useState } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { HIDDiscoveryState } from "@ledgerhq/live-dmk-mobile";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { e2eBridgeClient } from "../../e2e/bridge/client";
import { filter } from "rxjs/operators";

type MockHIDDiscoveredDevice = {
  deviceId: string;
  deviceName: string;
  wired: true;
  modelId: DeviceModelId;
  discoveredDevice: DiscoveredDevice;
};

/**
 * Mock hook for HID/USB device discovery in e2e tests.
 *
 * Subscribes directly to `e2eBridgeClient` for "addUSB" events sent by the
 * test runner via `addDevicesUSB()`.
 *
 * The `deviceId` format `usb|${JSON.stringify(payload)}` must match what the e2e test expects:
 * - `common.page.ts` builds test ID: `device-item-usb|${JSON.stringify(nano)}`
 * - `DeviceItem.tsx` renders test ID: `device-item-${device.deviceId}`
 *
 * @param enabled - Whether discovery is currently enabled
 * @returns HIDDiscoveryState with discovered HID devices
 *
 * @example
 * // In e2e test (server side):
 * await app.common.addDeviceViaUSB("nanoSP");
 *
 * // This triggers in server.ts:
 * bridge.addDevicesUSB({ deviceId: "1002", deviceName: "Ledger Nano S Plus", ... });
 *
 * // Which sends an "addUSB" message that this hook receives via e2eBridgeClient
 */
export const useMockHidDevicesDiscovery = (enabled: boolean): HIDDiscoveryState => {
  const [hidDevices, setHidDevices] = useState<MockHIDDiscoveredDevice[]>([]);

  useEffect(() => {
    if (!enabled) {
      setHidDevices([]);
      return;
    }

    const subscription = e2eBridgeClient
      .pipe(filter(msg => msg.type === "addUSB"))
      .subscribe(msg => {
        if (msg.type === "addUSB") {
          const descriptor = msg.payload;
          const deviceId = `usb|${JSON.stringify(descriptor)}`;

          const newDevice: MockHIDDiscoveredDevice = {
            deviceId,
            deviceName: descriptor.deviceName,
            wired: true,
            modelId: descriptor.modelId as DeviceModelId,
            // Not used in mock mode -- communication is mocked via mockDeviceEventSubject
            discoveredDevice: undefined as unknown as DiscoveredDevice,
          };

          setHidDevices(prev => {
            const exists = prev.some(d => d.deviceId === deviceId);
            if (exists) return prev;
            return [...prev, newDevice];
          });
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled]);

  return {
    hidDevices,
    error: null,
  };
};
