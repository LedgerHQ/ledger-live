/** Represents all the possible states of a migration. */
export type MigrationStatus = "not-started" | "in-progress" | "completed" | "rolled-back";

/** Represents all the available rollback statuses. */
export type RollbackStatus = "not-started" | "in-progress" | "completed";
