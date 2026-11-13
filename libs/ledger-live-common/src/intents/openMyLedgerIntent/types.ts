import type {
  DeviceConnectionResult,
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { DeviceId } from "@domain/entity-client-identity";
import type { DeviceInfo } from "@ledgerhq/types-live";
import type { ListAppsResult } from "../../apps/types";
import type { Device } from "../../hw/actions/types";

/**
 * `loaded` completes the observable. `device-locked` and `quit-app` stay open and expose `retry`.
 * Other failures are observable errors.
 */
export type OpenMyLedgerIntentJobState =
  | { type: "loading"; device: Device }
  | { type: "unresponsive"; device: Device }
  | { type: "allow-secure-connection"; device: Device }
  | { type: "device-locked"; device: Device; retry: () => void }
  | { type: "quit-app"; device: Device; retry: () => void }
  | { type: "not-onboarded"; device: Device }
  | { type: "bootloader"; device: Device; deviceInfo: DeviceInfo }
  | { type: "counterfeit"; device: Device }
  | { type: "loaded"; device: Device };

export type ResolveOsUpdates = (
  params: Readonly<{
    deviceConnectionResult: DeviceConnectionResult;
    device: Device;
    deviceInfo: DeviceInfo;
  }>,
) => Promise<void>;

export type OpenMyLedgerIntentInput = {
  /** Runs after the apps are listed, before the result is reported. */
  readonly resolveOsUpdates?: ResolveOsUpdates;
};

/** What the My Ledger screen needs, and the device id read over the secure channel. */
export type OpenMyLedgerIntentResult = {
  device: Device;
  deviceInfo: DeviceInfo;
  result: ListAppsResult;
  deviceId: DeviceId | undefined;
};

export type OpenMyLedgerIntentDefinition = IntentDefinition<
  OpenMyLedgerIntentJobState,
  OpenMyLedgerIntentInput,
  OpenMyLedgerIntentResult
>;

export type OpenMyLedgerIntentPlatformDefinition<ExtraProps = undefined> = IntentPlatformDefinition<
  OpenMyLedgerIntentJobState,
  OpenMyLedgerIntentInput,
  ExtraProps,
  OpenMyLedgerIntentResult
>;

export type OpenMyLedgerIntent<ExtraProps = undefined> = Intent<
  OpenMyLedgerIntentJobState,
  OpenMyLedgerIntentInput,
  ExtraProps,
  OpenMyLedgerIntentResult
>;
