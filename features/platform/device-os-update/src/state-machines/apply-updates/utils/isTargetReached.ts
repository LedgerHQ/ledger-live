import type { GetOsVersionResponse } from "@ledgerhq/device-management-kit";
import { DeviceReadyTarget } from "../types";

/**
 * Mirrors the legacy completion checks, which read the bootloader and OSU flags and never compare
 * versions: `finalFirmware.version` and the reported `seVersion` are not formatted alike, and a
 * mismatch would leave the wait polling until the invoking state times out.
 */
export const isTargetReached = (
  osVersion: GetOsVersionResponse,
  target: DeviceReadyTarget,
): boolean => {
  switch (target) {
    case DeviceReadyTarget.AnyResponse:
      return true;
    case DeviceReadyTarget.UpdatedOs:
      return !osVersion.isOsu && !osVersion.isBootloader;
    default: {
      const unhandled: never = target;
      return unhandled;
    }
  }
};
