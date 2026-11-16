import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  GetOrCreateTrustchainCallbacks,
  MemberCredentials,
  Trustchain,
  TrustchainResult,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { CreateSessionSdk } from "../../session";
import type { LedgerSyncJobState } from "../../jobState";

/** What the app passes to add this instance to the Ledger Sync trustchain of the device seed. */
export type AddMemberIntentInput = Readonly<{
  /** The key pair of this instance, the member the device signs in. */
  memberCredentials: MemberCredentials;
  /** The trustchain this instance already knows, so the SDK restores it instead of creating one. */
  currentTrustchain?: Trustchain;
  /** Builds the SDK on the DIE session of the run. */
  createSessionSdk: CreateSessionSdk;
  /**
   * Called with the trustchains of the device seed before anything is created or joined. A throw
   * ends the run: `NoTrustchainInitialized` maps to `failed` with `no-trustchain`.
   */
  onInitialResponse?: GetOrCreateTrustchainCallbacks["onInitialResponse"];
}>;

/** The states the add member job emits. */
export type AddMemberJobState = LedgerSyncJobState;

/**
 * The intent this package exports, without a renderer. It delivers `TrustchainResult` to `onResult`.
 */
export type AddMemberIntentDefinition = IntentDefinition<
  AddMemberJobState,
  AddMemberIntentInput,
  TrustchainResult
>;

/**
 * What each app builds by spreading the definition and adding its `component`, which receives
 * `ExtraProps`. It delivers `TrustchainResult` to `onResult`.
 */
export type AddMemberIntentPlatformDefinition<ExtraProps = undefined> = IntentPlatformDefinition<
  AddMemberJobState,
  AddMemberIntentInput,
  ExtraProps,
  TrustchainResult
>;

/**
 * What `createIntent` returns from the platform definition, the input and `onResult`, ready for
 * the `DeviceIntentExecutor`. It delivers `TrustchainResult` to `onResult`.
 */
export type AddMemberIntent<ExtraProps = undefined> = Intent<
  AddMemberJobState,
  AddMemberIntentInput,
  ExtraProps,
  TrustchainResult
>;
