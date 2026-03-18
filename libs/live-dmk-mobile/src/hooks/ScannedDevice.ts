import { DeviceId, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";

export type ScannedDevice = {
  deviceId: DeviceId;
  deviceName: string;
  wired: boolean;
  modelId: DeviceModelId;
  discoveredDevice: DiscoveredDevice;
};
