import { GetLatestAvailableFirmwareActionState } from "../actions/getLatestAvailableFirmware";

/**
 * Array of firmware versions that are ignored for the given device model
 */
type IgnoredOSUpdates = Array<string>;

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
  // filter out the ignored firmware versions
  if (
    newValue.status === "available-firmware" &&
    ignoredOSUpdates &&
    newValue.firmwareUpdateContext?.final.name
  ) {
    if (ignoredOSUpdates.includes(newValue.firmwareUpdateContext?.final.name)) {
      return {
        ...newValue,
        firmwareUpdateContext: null,
        status: "no-available-firmware",
      };
    }
  }
  return newValue;
};
