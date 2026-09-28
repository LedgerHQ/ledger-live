import type { PasswordVerifier } from "@shared/password-verifier";

export type PasswordCheck =
  | Readonly<{ status: "correct"; verifier: PasswordVerifier }>
  | Readonly<{ status: "incorrect" }>
  | Readonly<{ status: "notSet" }>;

export type MigrationResult =
  | Readonly<{ status: "notNeeded" }>
  | Readonly<{ status: "migrated"; needsLongerPassword: boolean }>
  | Readonly<{ status: "deferred" }>;
