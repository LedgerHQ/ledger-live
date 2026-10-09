import {
  DeviceManagementKitBuilder,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";

type DmkMethodName = {
  [Name in keyof DeviceManagementKit]: DeviceManagementKit[Name] extends (...args: any[]) => any
    ? Name
    : never;
}[keyof DeviceManagementKit];

export type DeviceManagementKitOverrides = Partial<Record<DmkMethodName, (...args: any[]) => any>>;

export function createDeviceManagementKit(
  overrides: DeviceManagementKitOverrides = {},
): DeviceManagementKit {
  return Object.assign(new DeviceManagementKitBuilder().build(), overrides);
}
