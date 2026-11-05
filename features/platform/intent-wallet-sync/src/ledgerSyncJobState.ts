import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  LedgerSyncDeviceRejectedJobState,
  LedgerSyncFailureJobState,
} from "./ledgerSyncFailure";

/**
 * The states every Ledger Sync device intent emits.
 *
 * `device-rejected` keeps the job open so the user can retry; `completed` and
 * `failed` are terminal and the job completes right after emitting them.
 */
export type LedgerSyncJobState =
  | { readonly type: "pending" }
  | {
      readonly type: "awaiting-device-confirmation";
      readonly deviceModelId: DeviceModelId;
      readonly deviceName: string;
    }
  | LedgerSyncDeviceRejectedJobState
  | { readonly type: "completed" }
  | LedgerSyncFailureJobState;
