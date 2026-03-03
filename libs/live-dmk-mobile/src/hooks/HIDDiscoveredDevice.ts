import { DeviceId, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";

export type HIDDiscoveredDevice = {
  deviceId: DeviceId;
  deviceName: string;
  wired: true;
  modelId: DeviceModelId;
  discoveredDevice: DiscoveredDevice;
};
