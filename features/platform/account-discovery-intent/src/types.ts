import type {
  DeviceConnectionResult,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  AccountExists,
  DeriveAccount,
  DiscoverOptions,
  DiscoveredAccount,
} from "@features/platform-account-discovery";

export type AccountDiscoveryIntentInput = {
  readonly options: DiscoverOptions;
  /** Host-injected: how the app the executor opened derives a key, on its session. */
  readonly createDerive: (connection: DeviceConnectionResult) => DeriveAccount;
  readonly exists: AccountExists;
};

/** `scanning` until the scan is over, then `done` completes the observable. Failures are observable errors. */
export type AccountDiscoveryIntentJobState =
  | { type: "scanning"; discovered: readonly DiscoveredAccount[] }
  | { type: "done"; discovered: readonly DiscoveredAccount[] };

export type AccountDiscoveryIntentResult = readonly DiscoveredAccount[];

export type AccountDiscoveryIntentDefinition = IntentDefinition<
  AccountDiscoveryIntentJobState,
  AccountDiscoveryIntentInput,
  AccountDiscoveryIntentResult
>;

export type AccountDiscoveryIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    AccountDiscoveryIntentJobState,
    AccountDiscoveryIntentInput,
    ExtraProps,
    AccountDiscoveryIntentResult
  >;
