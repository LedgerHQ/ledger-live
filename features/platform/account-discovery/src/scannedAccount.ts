import type { AccountUUID } from "@domain/entity-account";
import type { AccountStatus } from "@domain/entity-account-status";
import type { AccountCandidate } from "@domain/entity-derivation";

/** A discovered account as the UI holds it: its descriptor stays in the `discoveredAccounts` register. */
export type ScannedAccount = {
  readonly accountUUID: AccountUUID;
  readonly candidate: AccountCandidate;
  readonly status: AccountStatus;
};
