import type {
  DeviceConnectionResult,
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  ReadAccountStatus,
  DeriveAccount,
  DiscoverOptions,
  DiscoveredAccount,
} from "@features/platform-account-discovery";

export type AccountDiscoveryIntentInput = {
  readonly options: DiscoverOptions;
  /** Host-injected: how the app the executor opened derives a key, on its session. */
  readonly createDerive: (connection: DeviceConnectionResult) => DeriveAccount;
  readonly readStatus: ReadAccountStatus;
};

/** `scanning` until the scan is over, then `done` or `error` completes the observable, which never errors. */
export type AccountDiscoveryIntentJobState =
  | { type: "scanning"; discovered: readonly DiscoveredAccount[] }
  | { type: "done"; discovered: readonly DiscoveredAccount[] }
  /** The accounts found before the failure stay, for the intent UI to offer them or a retry. */
  | { type: "error"; error: Error; discovered: readonly DiscoveredAccount[] };

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

export type AccountDiscoveryIntent<ExtraProps = undefined> = Intent<
  AccountDiscoveryIntentJobState,
  AccountDiscoveryIntentInput,
  ExtraProps,
  AccountDiscoveryIntentResult
>;
