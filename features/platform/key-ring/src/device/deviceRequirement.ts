import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import type { KeyRingDeviceInitialization, KeyRingDeviceRequirement } from "../types";
import { KeyRingDeviceUnsupportedError } from "../errors";

/**
 * What the device must provide before a key ring device operation: the Ledger Sync app today.
 * Read the requirement instead of hard-coding the app, as another protocol version may need an
 * OS feature instead.
 */
export function getKeyRingDeviceRequirement(): KeyRingDeviceRequirement {
  return { kind: "app", appName: TRUSTCHAIN_APP_NAME };
}

/**
 * The device initialization the DIE executor needs before a key ring device operation, from the
 * device requirement. Call it when the step starts, never at module load. Throws
 * `KeyRingDeviceUnsupportedError` for a requirement the DIE input cannot express yet.
 *
 * @example
 * ```ts
 * buildDeviceInitializationInput(getKeyRingDeviceInitialization()).then(setInput);
 * ```
 */
export function getKeyRingDeviceInitialization(): KeyRingDeviceInitialization {
  const requirement = getKeyRingDeviceRequirement();
  if (requirement.kind !== "app") {
    throw new KeyRingDeviceUnsupportedError("The device initialization needs an app requirement");
  }
  return { appRequest: { appName: requirement.appName } };
}
