import type { DeviceIntentSessionOutcomes } from "@features/platform-device-intent-session";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";

/**
 * How address verification ended. Everything but `mismatch` brings the receive
 * summary back; `mismatch` closes the flow because the reported address must
 * not be shared.
 */
export type PayVerifyOutcome =
  | "verified"
  | "cancelled"
  | "unsupported"
  | "mismatch"
  | "dismissed"
  | "initFailed";

function outcomeFromLastState(state: VerifyAddressIntentJobState | undefined): PayVerifyOutcome {
  switch (state?.type) {
    case "mismatch":
      return "mismatch";
    case "unsupported":
      return "unsupported";
    case "cancelled":
      return "cancelled";
    default:
      return "dismissed";
  }
}

export const payVerifyAddressOutcomes: DeviceIntentSessionOutcomes<
  VerifyAddressIntentJobState,
  PayVerifyOutcome
> = {
  fromJobState: jobState => (jobState.type === "verified" ? "verified" : undefined),
  fromUserCancel: outcomeFromLastState,
  setupFailed: "initFailed",
};
