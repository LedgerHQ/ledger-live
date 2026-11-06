import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainMember,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { CreateSessionSdk } from "../../session";
import type { LedgerSyncJobState } from "../../jobState";

/** What the app passes to remove another instance from the Ledger Sync trustchain. */
export type RemoveMemberIntentInput = Readonly<{
  /** The trustchain this instance is a member of. */
  trustchain: Trustchain;
  /** The key pair of this instance, which authenticates the removal. */
  memberCredentials: MemberCredentials;
  /** The instance to remove, as the SDK lists it. */
  member: TrustchainMember;
  /** Builds the SDK on the DIE session of the run. */
  createSessionSdk: CreateSessionSdk;
}>;

/** The states the remove member job emits. */
export type RemoveMemberJobState = LedgerSyncJobState;

/**
 * The intent this package exports, without a renderer. It delivers the new `Trustchain` to `onResult`.
 */
export type RemoveMemberIntentDefinition = IntentDefinition<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  Trustchain
>;

/**
 * What each app builds by spreading the definition and adding its `component`, which receives
 * `ExtraProps`. It delivers the new `Trustchain` to `onResult`.
 */
export type RemoveMemberIntentPlatformDefinition<ExtraProps = undefined> = IntentPlatformDefinition<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  ExtraProps,
  Trustchain
>;

/**
 * What `createIntent` returns from the platform definition, the input and `onResult`, ready for
 * the `DeviceIntentExecutor`. It delivers the new `Trustchain` to `onResult`.
 */
export type RemoveMemberIntent<ExtraProps = undefined> = Intent<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  ExtraProps,
  Trustchain
>;
