import type { DeviceModelId } from "@ledgerhq/device-management-kit";

/**
 * The states every Ledger Sync device intent emits.
 *
 * `processing` follows each device confirmation until the next one or the end of the run.
 * `device-rejected` keeps the job open so the user can retry; `completed` and
 * `failed` are terminal and the job completes right after emitting them.
 */
export type LedgerSyncJobState =
  | LedgerSyncPendingJobState
  | LedgerSyncAwaitingDeviceConfirmationJobState
  | LedgerSyncProcessingJobState
  | LedgerSyncDeviceRejectedJobState
  | LedgerSyncCompletedJobState
  | LedgerSyncFailureJobState;

export interface LedgerSyncPendingJobState {
  readonly type: "pending";
}

export interface LedgerSyncAwaitingDeviceConfirmationJobState {
  readonly type: "awaiting-device-confirmation";
  readonly deviceModelId: DeviceModelId;
  readonly deviceName: string;
}

export interface LedgerSyncProcessingJobState {
  readonly type: "processing";
}

export interface LedgerSyncDeviceRejectedJobState {
  readonly type: "device-rejected";
  readonly error: Error;
  /** Re-runs the SDK call on the same DIE session, once per rejection. */
  readonly retry: () => void;
}

export interface LedgerSyncCompletedJobState {
  readonly type: "completed";
}

export interface LedgerSyncFailureJobState {
  readonly type: "failed";
  readonly reason: LedgerSyncFailureReason;
  readonly error: Error;
}

export type LedgerSyncFailureReason =
  | "already-secured-same-seed"
  | "already-secured-other-seed"
  | "not-allowed"
  | "no-trustchain"
  | "unknown";
