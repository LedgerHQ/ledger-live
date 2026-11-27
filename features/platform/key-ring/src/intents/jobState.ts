import type { DeviceModelId } from "@ledgerhq/device-management-kit";

/**
 * The states every Ledger Sync device intent emits, starting with `pending`.
 *
 * `completed` and `failed` are terminal: the job completes right after emitting them.
 * `device-rejected` keeps the job open until the user retries or leaves. A device
 * disconnection is not a state: it errors the observable so DIE shows its Disconnected screen.
 */
export type LedgerSyncJobState =
  | LedgerSyncPendingJobState
  | LedgerSyncAwaitingDeviceConfirmationJobState
  | LedgerSyncProcessingJobState
  | LedgerSyncDeviceRejectedJobState
  | LedgerSyncCompletedJobState
  | LedgerSyncFailureJobState;

/**
 * Emitted when a run starts, before the device asks for anything: the key ring is talking to the
 * backend or sending APDUs. The app shows a loader.
 */
export interface LedgerSyncPendingJobState {
  readonly type: "pending";
}

/**
 * Emitted each time the device asks the user to confirm. The app shows the confirmation
 * screen for that device and locks the executor so the user cannot cancel mid-operation.
 */
export interface LedgerSyncAwaitingDeviceConfirmationJobState {
  readonly type: "awaiting-device-confirmation";
  readonly deviceModelId: DeviceModelId;
  /** The name to show, as the device reports it. */
  readonly deviceName: string;
}

/**
 * Emitted after each confirmation, until the next one or the end of the run: the key ring is
 * finishing the key tree change. The app keeps the executor locked and shows a loader.
 */
export interface LedgerSyncProcessingJobState {
  readonly type: "processing";
}

/**
 * Emitted when the user refused on the device. The job stays open: the app offers a retry
 * or lets the user leave.
 */
export interface LedgerSyncDeviceRejectedJobState {
  readonly type: "device-rejected";
  readonly error: Error;
  /** Re-runs the key ring call on the same DIE session, once per rejection. */
  readonly retry: () => void;
}

/**
 * Terminal. Emitted right after the result went through `onResult`, so the app can close
 * the flow knowing its state is up to date.
 */
export interface LedgerSyncCompletedJobState {
  readonly type: "completed";
}

/**
 * Terminal. Emitted for any key ring error other than a refusal or a disconnection. The app routes
 * `reason` to its existing Ledger Sync error screen.
 */
export interface LedgerSyncFailureJobState {
  readonly type: "failed";
  readonly reason: LedgerSyncFailureReason;
  /** The original error, kept for logs. */
  readonly error: Error;
}

/** Why a Ledger Sync device call failed, from the category of the key ring error. */
export type LedgerSyncFailureReason =
  /** `already-member`: this instance is already in the key tree of this seed. */
  | "already-secured-same-seed"
  /** `member-of-other-tree`: this instance is synced with another seed. */
  | "already-secured-other-seed"
  /** `not-allowed`: no permission on this key tree, often the wrong device seed. */
  | "not-allowed"
  /** `no-tree-for-seed`: there is no key tree yet to add the member to. */
  | "no-trustchain"
  /** `device-unsupported`: the device or its OS cannot run the key ring protocol. */
  | "device-unsupported"
  /** Any other error. */
  | "unknown";
