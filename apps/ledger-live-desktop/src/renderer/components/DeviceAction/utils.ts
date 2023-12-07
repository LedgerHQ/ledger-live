import { TransportStatusError } from "@ledgerhq/errors";
import { DeviceNotOnboarded } from "@ledgerhq/live-common/errors";

// NB Until we find a better way,
// remap the error if it's 6d06 (LNS, LNSP, LNX) or 6d07 (Stax) and we haven't fallen
// into another handled case.
export function isDeviceNotOnboardedError(e: unknown) {
  return (
    e instanceof DeviceNotOnboarded ||
    (e instanceof TransportStatusError &&
      (e.message.includes("0x6d06") || e.message.includes("0x6d07")))
  );
}
