import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Features } from "@shared/feature-flags";

/**
 * Whether the Recover entry point should be offered for the given device model.
 *
 * Recover is offered on every Ledger device except the Nano S, which is the
 * only model that does not support Recover today and the rule is not expected
 * to change.
 */
export function isRecoverDisplayed(
  feature:
    | Features["protectServicesDesktop"]
    | Features["protectServicesMobile"]
    | null
    | undefined,
  deviceModelId: DeviceModelId | null | undefined,
): boolean {
  return Boolean(feature?.enabled && deviceModelId && deviceModelId !== DeviceModelId.nanoS);
}
