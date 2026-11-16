import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { MockServerDevice } from "./mockServerApi";

const DEVICE_MODEL_IDS: ReadonlySet<string> = new Set(Object.values(DeviceModelId));

export const getMockServerDeviceModelId = ({
  device_type,
}: MockServerDevice): DeviceModelId | undefined =>
  DEVICE_MODEL_IDS.has(device_type) ? (device_type as DeviceModelId) : undefined;
