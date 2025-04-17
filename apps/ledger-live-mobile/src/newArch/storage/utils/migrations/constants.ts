import { MigrationStatus, RollbackStatus } from "./types";

/** All possible states of a migration. */
export const MIGRATION_STATUS = {
  NOT_STARTED: "not-started",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  ROLLED_BACK: "rolled-back",
} as const satisfies Record<string, MigrationStatus>;

/** Key where the migration status is stored in storage migration target. */
export const MIGRATION_STATUS_KEY = "migration-status";

/** Constants for {@link RollbackStatus}. */
export const ROLLBACK_STATUS = {
  NOT_STARTED: "not-started",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
} as const satisfies Record<string, RollbackStatus>;

/** Key where the rollback status is stored in storage rollback target. */
export const ROLLBACK_STATUS_KEY = "rollback-status";
