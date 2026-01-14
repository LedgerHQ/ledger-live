import type { StorageType } from "LLM/storage/types";
import type { MigrationStatus, RollbackStatus } from "../types";

type YesNo = "Yes" | "No";

export interface StorageMigrationUserProps {
  hasRolledBack: YesNo;
  hasMigrated: YesNo;
  useMMKV: YesNo;
  numberOfReadErrors: number;
}

interface StorageMigrationUserEventError {
  count: number;
  lastError?: { stackTrace: string; key: string | null };
}

export interface StorageMigrationUserEvent {
  from: StorageType;
  to: StorageType;
  migrationStatus: MigrationStatus;
  rollbackStatus: RollbackStatus;
  errors: StorageMigrationUserEventError;
  dateTime: Date;
}
