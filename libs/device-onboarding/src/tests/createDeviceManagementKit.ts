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
  const dmk = new DeviceManagementKitBuilder().build();

  for (const [name, impl] of Object.entries(overrides)) {
    jest.spyOn(dmk, name as never).mockImplementation(impl as never);
  }

  return dmk;
}
