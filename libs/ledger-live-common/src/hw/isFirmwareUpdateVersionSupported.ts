import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { satisfies, coerce } from "semver";
import { getEnv } from "../env";

const deviceVersionRangesForUpdate: { [key in DeviceModelId]?: string } = {
  nanoS: ">=1.6.1",
  nanoX: ">=1.3.0",
  nanoSP: ">=1.0.0",
  stax: ">=1.0.0",
};

// TODO when BLE FW update is released, we'll have to add support for BLE/OTG
// version checks instead of a single version.
export default (deviceInfo: DeviceInfo, modelId: DeviceModelId): boolean =>
  getEnv("DISABLE_FW_UPDATE_VERSION_CHECK") ||
  (Boolean(deviceVersionRangesForUpdate[modelId]) &&
    satisfies(
      coerce(deviceInfo.version),
      deviceVersionRangesForUpdate[modelId] as string
    ));
