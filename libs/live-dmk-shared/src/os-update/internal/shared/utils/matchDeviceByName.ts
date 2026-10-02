/**
 * An OS update changes both the BLE address a device advertises and its default name, which loses
 * its prefix: "Ledger Nano X 123A" comes back as "123A". The address change rules out matching the
 * device id, so the rediscovered device is matched on its name instead.
 *
 * Reimplemented from `matchDevicesByNameOrId` in live-dmk-mobile to avoid depending on it.
 */

/** Matches "Ledger ... ABCD", where ABCD is the 4 hex digits the new name keeps. */
const OLD_DEFAULT_BLE_NAME = /^(Ledger|Nano) .* [0-9A-Fa-f]{4}$/;

const NEW_DEFAULT_BLE_NAME = /^[0-9A-Fa-f]{4}$/;

export const matchDeviceByName = (
  previousName: string | null | undefined,
  candidateName: string | null | undefined,
): boolean => {
  if (!previousName || !candidateName) {
    return false;
  }

  // A custom name survives the update untouched.
  if (previousName === candidateName) {
    return true;
  }

  if (OLD_DEFAULT_BLE_NAME.test(previousName) && NEW_DEFAULT_BLE_NAME.test(candidateName)) {
    return previousName.endsWith(candidateName);
  }

  return false;
};
