import type { PasswordVerifier } from "@shared/password-verifier";

export type PasswordCheck =
  | Readonly<{ status: "correct"; verifier: PasswordVerifier }>
  | Readonly<{ status: "incorrect" }>
  | Readonly<{ status: "notSet" }>;

export type MigrationResult =
  /** No legacy password to move. */
  | Readonly<{ status: "notNeeded" }>
  /** `needsLongerPassword` can only be judged here: the plaintext is gone afterwards. */
  | Readonly<{ status: "migrated"; needsLongerPassword: boolean }>
  /** The verifier is written but unproven, so the legacy entry stays: the user can still get in. */
  | Readonly<{ status: "deferred" }>;
