import { DeviceModelId } from "@ledgerhq/types-devices";

export const OUTDATED_OS_VERSION_BY_MODEL: Partial<Record<DeviceModelId, string>> = {
  [DeviceModelId.nanoS]: "2.0.0",
  [DeviceModelId.nanoSP]: "1.6.1",
  [DeviceModelId.nanoX]: "2.7.1",
  [DeviceModelId.stax]: "1.10.1",
  [DeviceModelId.europa]: "1.6.1",
  [DeviceModelId.apex]: "1.1.1",
};
