import { useEffect, useState } from "react";
import type { Subscription } from "rxjs";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { useDeviceManagementKit } from "./useDeviceManagementKit";
import { HIDDiscoveredDevice } from "./HIDDiscoveredDevice";
import { log } from "@ledgerhq/logs";

export const mapDiscoveredDeviceToHIDDiscoveredDevice = (
  device: DiscoveredDevice,
): HIDDiscoveredDevice => ({
  deviceId: `usb|${device.id}`,
  deviceName: device.deviceModel.name,
  wired: true,
  modelId: dmkToLedgerDeviceIdMap[device.deviceModel.model],
  discoveredDevice: device,
});

export type HIDDiscoveryState = {
  hidDevices: HIDDiscoveredDevice[];
  error: Error | null;
};

export const useHidDevicesDiscovery = (enabled: boolean = true): HIDDiscoveryState => {
  const dmk = useDeviceManagementKit();
  const [hidDevices, setHidDevices] = useState<HIDDiscoveredDevice[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!dmk || !enabled) return;

    let subscription: Subscription | null = null;

    const finalizeDiscovery = () => {
      if (subscription) {
        subscription.unsubscribe();
        dmk.stopDiscovering();
        subscription = null;
      }
      setHidDevices([]);
    };

    setError(null);
    log("useHidDevicesDiscovery", "useEffect -> calling dmk.listenToAvailableDevices()");
    subscription = dmk
      .listenToAvailableDevices({
        transport: rnHidTransportIdentifier,
      })
      .subscribe({
        next: devices => {
          const newDeviceByIds: Record<string, HIDDiscoveredDevice> = {};
          devices.forEach(device => {
            const mappedDevice = mapDiscoveredDeviceToHIDDiscoveredDevice(device);
            newDeviceByIds[mappedDevice.deviceId] = mappedDevice;
          });
          setHidDevices(Object.values(newDeviceByIds));
        },
        error: err => {
          setError(err);
          log("useHidDevicesDiscovery", "error", `${err.type}: ${err.message}`);
          log("useHidDevicesDiscovery", "error -> unsubscribing and stopping discovery");
          finalizeDiscovery();
        },
        complete: () => {
          log("useHidDevicesDiscovery", "complete -> unsubscribing and stopping discovery");
          finalizeDiscovery();
        },
      });

    return () => {
      log("useHidDevicesDiscovery", "useEffect cleanup -> unsubscribing and stopping discovery");
      finalizeDiscovery();
    };
  }, [dmk, enabled]);

  return {
    hidDevices,
    error,
  };
};
