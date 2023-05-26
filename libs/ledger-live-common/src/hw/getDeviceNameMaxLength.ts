import { DeviceModelId } from "@ledgerhq/devices";
import semver from "semver";

type Props = {
  deviceModelId: DeviceModelId;
  version: string;
};

/**
 * This code enforces a maximum device name length on the Live side due to a bug
 * in LNX <2.2.0 that breaks the BLE stack if the name is longer than 17 characters.
 * To ensure consistency with the maximum length that can be set on Stax (23), the
 * visible characters (20), and the maximum APDU-driven rename length (30), this
 * patch introduces a maximum length of 20 characters until all inconsistencies
 * are aligned.
 */
const getDeviceNameMaxLength = (props: Props): number => {
  const { deviceModelId, version } = props;

  let maxLength = 17; // Default for other models and versions.

  switch (deviceModelId) {
    case DeviceModelId.nanoX: {
      const coercedVersion = semver.coerce(version);
      const validVersion = semver.valid(coercedVersion) || "";

      if (semver.gte(validVersion, "2.2.0")) {
        maxLength = 20;
      }
      break;
    }

    case DeviceModelId.stax:
      maxLength = 20;
      break;
  }

  return maxLength;
};

export default getDeviceNameMaxLength;
