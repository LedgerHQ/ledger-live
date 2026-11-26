import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { KeyRingClient, KeyRingMember, KeyRingSession, KeyRingTreeUpdate } from "../../types";
import type { LedgerSyncJobState } from "../jobState";
import type { LedgerSyncResultOrder } from "../ledgerSyncResultOrder";

/** What the app passes to remove another instance from the key tree. */
export type RemoveMemberIntentInput = Readonly<{
  /** This instance when the run starts: it authenticates the removal. */
  session: KeyRingSession;
  /** The instance to remove, as the key ring lists it. */
  member: KeyRingMember;
  /** The app's key ring client; the job binds it to the DIE session of each run. */
  client: KeyRingClient;
  /** The host's one result order, shared by add member and remove member runs. */
  resultOrder: LedgerSyncResultOrder;
}>;

/** The states the remove member job emits. */
export type RemoveMemberJobState = LedgerSyncJobState;

/** The intent this package exports, without a renderer. It delivers the new key tree to `onResult`. */
export type RemoveMemberIntentDefinition = IntentDefinition<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  KeyRingTreeUpdate
>;

/**
 * What each app builds by spreading the definition and adding its `component`, which receives
 * `ExtraProps`. It delivers the new key tree to `onResult`.
 */
export type RemoveMemberIntentPlatformDefinition<ExtraProps = undefined> = IntentPlatformDefinition<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  ExtraProps,
  KeyRingTreeUpdate
>;

/**
 * What `createIntent` returns from the platform definition, the input and `onResult`, ready for
 * the `DeviceIntentExecutor`. It delivers the new key tree to `onResult`.
 */
export type RemoveMemberIntent<ExtraProps = undefined> = Intent<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  ExtraProps,
  KeyRingTreeUpdate
>;
