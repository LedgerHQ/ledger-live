import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";

export type DisplayedDevice = { device: Device } & (
  | { available: true; discoveredDevice: DiscoveredDevice }
  | { available: false }
);

export type DisplayedAvailableDevice = {
  device: Device;
  available: true;
  discoveredDevice: DiscoveredDevice;
};
