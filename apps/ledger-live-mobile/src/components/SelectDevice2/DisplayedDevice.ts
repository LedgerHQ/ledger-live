import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";

export type DisplayedDevice = Device & {
  available: boolean;
  discoveredDevice?: DiscoveredDevice;
};
