import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { NotifyDeviceRequest } from "./getAddressVerification";

const DEVICE_REQUEST_METHODS = new Set<PropertyKey>([
  "sendApdu",
  "sendCommand",
  "executeDeviceAction",
]);

/**
 * Wraps `dmk` so `onDeviceRequest` runs whenever something is sent to the device,
 * whether through a `DmkCompatTransport` (APDU) or a DMK signer kit (device action).
 */
export function notifyOnDeviceRequest(
  dmk: DeviceManagementKit,
  onDeviceRequest: NotifyDeviceRequest,
): DeviceManagementKit {
  return new Proxy(dmk, {
    get(target, property) {
      const value: unknown = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      if (!DEVICE_REQUEST_METHODS.has(property)) return value.bind(target);

      return (...args: unknown[]) => {
        onDeviceRequest();
        return value.apply(target, args);
      };
    },
  });
}
