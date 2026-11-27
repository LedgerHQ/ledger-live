import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { KeyRingActivation, KeyRingClient, KeyRingSession } from "../../types";
import type { LedgerSyncJobState } from "../jobState";
import type { LedgerSyncResultOrder } from "../ledgerSyncResultOrder";

/** What the app passes to add this instance to the key tree of the device seed. */
export type AddMemberIntentInput = Readonly<{
  /** This instance when the run starts: its member key, and the key tree it already knows. */
  session: KeyRingSession;
  /** The app's key ring client; the job binds it to the DIE session of each run. */
  client: KeyRingClient;
  /** The host's one result order, shared by add member and remove member runs. */
  resultOrder: LedgerSyncResultOrder;
  /**
   * False: when the device seed has no key tree yet, the run ends with `failed` and
   * `no-trustchain` instead of creating one. Default true.
   */
  allowTreeCreation?: boolean;
}>;

/** The states the add member job emits. */
export type AddMemberJobState = LedgerSyncJobState;

/** The intent this package exports, without a renderer. It delivers `KeyRingActivation` to `onResult`. */
export type AddMemberIntentDefinition = IntentDefinition<
  AddMemberJobState,
  AddMemberIntentInput,
  KeyRingActivation
>;

/**
 * What each app builds by spreading the definition and adding its `component`, which receives
 * `ExtraProps`. It delivers `KeyRingActivation` to `onResult`.
 */
export type AddMemberIntentPlatformDefinition<ExtraProps = undefined> = IntentPlatformDefinition<
  AddMemberJobState,
  AddMemberIntentInput,
  ExtraProps,
  KeyRingActivation
>;

/**
 * What `createIntent` returns from the platform definition, the input and `onResult`, ready for
 * the `DeviceIntentExecutor`. It delivers `KeyRingActivation` to `onResult`.
 */
export type AddMemberIntent<ExtraProps = undefined> = Intent<
  AddMemberJobState,
  AddMemberIntentInput,
  ExtraProps,
  KeyRingActivation
>;
