import { IgnoredOSUpdates } from "@ledgerhq/types-live";
import { GetLatestAvailableFirmwareActionState } from "../actions/getLatestAvailableFirmware";

/**
 * Filters out ignored firmware updates from the action state
 *
 * @param newValue The current action state
 * @param ignoredOSUpdates Array of firmware versions to ignore
 * @returns The filtered action state
 */
export const filterIgnoredFirmwareUpdates = (
  newValue: GetLatestAvailableFirmwareActionState,
  ignoredOSUpdates?: IgnoredOSUpdates,
): GetLatestAvailableFirmwareActionState => {
  // There is an available firmware update
  if (newValue.status === "available-firmware" && newValue.firmwareUpdateContext?.final.name) {
    // Filter out the ignored firmware versions
    if (ignoredOSUpdates && ignoredOSUpdates.includes(newValue.firmwareUpdateContext?.final.name)) {
      return {
        ...newValue,
        firmwareUpdateContext: null,
        status: "no-available-firmware",
      };
    }
  }
  return newValue;
};
