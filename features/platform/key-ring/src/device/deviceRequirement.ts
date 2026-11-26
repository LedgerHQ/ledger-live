import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import type { KeyRingDeviceInitialization, KeyRingDeviceRequirement } from "../types";
import { initializationOf } from "../internals/deviceInitialization";

/**
 * What the device must provide before a key ring device operation: the Ledger Sync app today.
 * Read the requirement instead of hard-coding the app, as another protocol version may need an
 * OS feature instead.
 */
export function getKeyRingDeviceRequirement(): KeyRingDeviceRequirement {
  return { kind: "app", appName: TRUSTCHAIN_APP_NAME };
}

/**
 * How to initialize the device before a key ring device operation, from the device requirement.
 * Call it when the step starts, never at module load. Branch on `kind`: an `os-feature`
 * requirement is one the DIE input cannot express yet, so report it with
 * `ledgerSyncDeviceUnsupportedFailure`.
 *
 * @example
 * ```ts
 * const initialization = getKeyRingDeviceInitialization();
 * if (initialization.kind === "app") {
 *   buildDeviceInitializationInput(initialization).then(setInput);
 * } else {
 *   intent.onJobStateChanged?.(ledgerSyncDeviceUnsupportedFailure(initialization));
 * }
 * ```
 */
export function getKeyRingDeviceInitialization(): KeyRingDeviceInitialization {
  return initializationOf(getKeyRingDeviceRequirement());
}
