import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import type { BackupBucket } from "../types";

export function getBackupBucket(state: LedgerRecoverSubscriptionStateEnum): BackupBucket {
  switch (state) {
    case LedgerRecoverSubscriptionStateEnum.BACKUP_DONE:
      return "done";
    case LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION:
      return "not-subscribed";
    case LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION:
    case LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY:
    case LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE:
      return "in-progress";
    default:
      return "in-progress";
  }
}
