import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  DeviceConnectionResult,
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { Observable } from "rxjs";

/**
 * `awaiting-confirmation`: the device request is in flight, not a read of the Secure Screen.
 * Unexpected failures must be observable errors, not a state.
 */
export type VerifyAddressDeviceState =
  | { type: "awaiting-confirmation" }
  | { type: "confirmed"; address: string }
  | { type: "refused" }
  | { type: "unsupported"; error?: Error };

export type VerifyAddressDeviceAction = {
  readonly observable: Observable<VerifyAddressDeviceState>;
  readonly cancel: () => void;
};

/** Host-injected verify. The app is already open (DIE Phase 2). */
export type StartAddressVerification = (
  connection: DeviceConnectionResult,
) => VerifyAddressDeviceAction;

export type VerifyAddressIntentInput = {
  /** Compared case-insensitively to the device-derived address. */
  readonly expectedAddress: string;
  readonly startAddressVerification: StartAddressVerification;
};

/**
 * `verified` / `mismatch` / `unsupported` complete the observable.
 * `addressDisplayed` (device request in flight: address shown or about to be) is non-terminal.
 * `cancelled` stays open and exposes `retry`. Other failures are observable errors.
 */
export type VerifyAddressIntentJobState =
  | { type: "verifying"; deviceModelId: DeviceModelId; deviceName: string }
  | { type: "addressDisplayed" }
  | { type: "verified"; address: string }
  | { type: "cancelled"; retry: () => void }
  | { type: "mismatch"; expectedAddress: string; reportedAddress: string }
  | { type: "unsupported"; error: Error };

/**
 * How the verification ended, reported through `onResult`. `refused` is reported on each refusal:
 * a retry can report another result, and the last one reported is the ending.
 */
export type VerifyAddressIntentResult =
  | { type: "verified"; address: string }
  | { type: "mismatch"; expectedAddress: string; reportedAddress: string }
  | { type: "unsupported"; error: Error }
  | { type: "refused" };

/** `Result` stays `undefined` for a host that ignores the result. */
export type VerifyAddressIntentDefinition<Result = undefined> = IntentDefinition<
  VerifyAddressIntentJobState,
  VerifyAddressIntentInput,
  Result
>;

export type VerifyAddressIntentPlatformDefinition<
  ExtraProps = undefined,
  Result = undefined,
> = IntentPlatformDefinition<
  VerifyAddressIntentJobState,
  VerifyAddressIntentInput,
  ExtraProps,
  Result
>;

export type VerifyAddressIntent<ExtraProps = undefined, Result = undefined> = Intent<
  VerifyAddressIntentJobState,
  VerifyAddressIntentInput,
  ExtraProps,
  Result
>;
